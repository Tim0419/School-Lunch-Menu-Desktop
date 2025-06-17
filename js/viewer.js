let updateTime = null;
let updateTimeTomorrow = { hour: null, minute: null };
let KitchenID = null;
let SchoolID = null;

const menu = document.getElementById('menu');
const ingredients = document.getElementById('ingredients');
const menu_title = document.querySelector('.menu_title');

let data_tempStorage = { data: null, time: null };

/**
 * getSettings
 * @param {string} path The path of the settings 設定的路徑
 * @returns {boolean} Whether the function processed failed 函數是否執行失敗
 */
async function getSettings(path) {
	try {
		path = path || './settings.json';
		const response = await fetch(path, {
			method: 'GET',
		});

		const settings = await response.json();

		updateTime = settings.update.time || 2 * 60 * 60 * 1 * 1000;
		updateTimeTomorrow.hour = settings.update.tomorrow.hour || 12;
		updateTimeTomorrow.minute = settings.update.tomorrow.minute || 30;
		bg_interactivity = settings.background.interactivity || false;
		bg_src = settings.background.src || '';
		KitchenID = settings.id.kitchen;
		SchoolID = settings.id.school;

		return false;
	} catch (error) {
		updateTime = 2 * 60 * 60 * 1 * 1000;
		updateTimeTomorrow.hour = 12;
		updateTimeTomorrow.minute = 30;
		bg_interactivity = false;
		bg_src = '';

		console.error(error);
		return true;
	}
}

async function errorHanding(err) {
	try {
		switch (err) {
			case 'Failed to get data':
				const a = condition_today(data_tempStorage.time);
				const b = condition_today();
				if (data_tempStorage.data && data_tempStorage.data[0] !== 'ERROR' && a === b) {
					console.warn('Using cached data');
					await showLunchData(data_tempStorage.data);
					return false;
				} else {
					console.error('No cached data available');
					menu.innerHTML = '無資料 / 無法取得資料';
					ingredients.innerHTML = '';
					return true;
				}
			default:
				console.error('Unknown error: ', err);
				break;
		}
		return false;
	} catch (error) {
		console.error('Error: ', error);
		return true;
	}
}

/**
 * getLunch
 * @param {number} day relation day 相對日期
 * @param {string} schoolId The id of the school 學校代碼
 * @param {string} kitchenId The id of the kitchen 廚房代碼
 * @returns {Array}
 */
async function getLunch(day, schoolId = null, kitchenId = null) {
	try {
		// Get the BatchDataId 取得BatchDataId
		const BatchDataId = await getBatchDataId(null, null, day, schoolId, kitchenId);

		/*
			It returns ["ERROR"] or [""] that a error happened or no data found.
			若發生錯誤或無資料，則回傳 [""] 或 [""]
		*/
		if (BatchDataId === 'ERROR') return ['ERROR'];
		if (!BatchDataId) return [''];

		// Returns the data of each dish 回傳每道餐點的資料
		return await getDishesData(BatchDataId);
	} catch (error) {
		console.error(error);

		// When a error happens, it returns ["ERROR"]. 當發生錯誤，回傳 ["ERROR"]
		return ['ERROR'];
	}
}

/**
 * showLunchData
 * @param {Array} dishes The data of each dishes 每一道餐點的資料
 * @returns Whether the function processed failed 函數是否執行失敗
 */
async function showLunchData(dishes) {
	try {
		// Clearing menu 清空菜單
		menu.innerHTML = '';

		if (!dishes[0]) return (menu.innerHTML = '不供餐 / 無資料');

		const Dishes = dishes;

		/*
		 * Show the information and the picture of each dish.
		 * 顯示每一道餐點的資訊及圖片
		 */
		Dishes.forEach(function (DishData) {
			const type = DishData.DishType;
			const name = DishData.DishName;
			const id = DishData.DishId;

			if (type === undefined) return; // specific data handing 特定資料處理

			const dish = document.createElement('div');
			const pic = document.createElement('div');
			const info = document.createElement('div');

			dish.className = 'dish';
			pic.className = 'pic';
			info.className = 'info';

			menu.appendChild(dish);
			dish.appendChild(pic);

			const line = document.createElement('div');
			line.className = 'line';
			dish.appendChild(line);

			dish.appendChild(info);

			dish.setAttribute('dishId', id);
			dish.setAttribute('dishType', type);

			const dish_pic = document.createElement('img');
			dish_pic.src = 'https://fatraceschool.k12ea.gov.tw/dish/pic/' + id;
			pic.appendChild(dish_pic);

			info.innerHTML = `<p>${type}<br>${name}</p>`;

			dish.addEventListener('click', async function () {
				ingredients.style = '';

				ingredients.innerHTML = '';

				let day = condition_today() ? 0 : 1;

				const ingerdientsData = await getDishIngredients(await getBatchDataId(null, null, day, SchoolID, KitchenID), id);

				/* ==== Build a different border for the dish which is selected ==== */
				/* ==== 為被選取的餐點建立不同的外框 ==== */

				const dish_selected = document.querySelector('.dish.selected');
				if (dish_selected) {
					dish_selected.className = 'dish';
				}
				dish.className = 'dish selected';

				/* ======= */

				if (!ingerdientsData || ingerdientsData.length === 0) return (ingredients.textContent = '無資料');

				// Build the type of each cols 建立每欄的類別
				ingredients.innerHTML =
					'<div class="ingredient"><div class="cell name">食材</div><div class="cell origin">產地</div><div class="cell supplier">供應商</div></div>';

				ingerdientsData.forEach(function (i, index) {
					const ingredient = document.createElement('div');
					const name = document.createElement('div');
					const origin = document.createElement('div');
					const supplier = document.createElement('div');

					ingredient.className = 'ingredient';
					name.className = 'cell name';
					supplier.className = 'cell supplier';
					origin.className = 'cell origin';

					name.innerHTML = i.IngredientName;
					supplier.innerHTML = i.SupplierName;
					origin.innerHTML = i.IngredientSourceNameList;

					ingredients.appendChild(ingredient);
					ingredient.appendChild(name);
					ingredient.appendChild(origin);
					ingredient.appendChild(supplier);

					if ((index + 1) % 2 === 1) {
						ingredient.style = 'background-color: aqua;';
					} else {
						ingredient.style = 'background-color: aliceblue;';
					}

					if (!(index + 1 === ingerdientsData.length)) ingredients.appendChild(document.createElement('hr'));
				});
			});
		});

		return false;
	} catch (error) {
		return true;
	}
}

async function update() {
	try {
		await getSettings();

		setBackground(bg_src, bg_interactivity);
		ingredients.innerHTML = '';
		ingredients.style = 'display: none;';

		if (condition_today()) {
			menu_title.innerHTML = '今日午餐菜單';
			menu_title.style = 'background-color: green; border-color: green;';
			const dishes = await getLunch(0, SchoolID, KitchenID);
			if (dishes[0] === 'ERROR') {
				await errorHanding('Failed to get data');
				return true;
			}
			data_tempStorage.data = dishes;
			data_tempStorage.time = new Date();
			await showLunchData(dishes);
			return false;
		}

		let nextDate = new Date();
		nextDate.setDate(nextDate.getDate() + 1);

		menu_title.innerHTML = '明日午餐菜單';
		menu_title.style = 'background-color: red; border-color: red;';

		const dishes = await getLunch(1, SchoolID, KitchenID);
		if (dishes[0] === 'ERROR') {
			await errorHanding('Failed to get data');
			return true;
		}

		data_tempStorage.data = dishes;
		data_tempStorage.time = new Date();
		await showLunchData(dishes);
		return false;
	} catch (error) {
		console.error('Error updating lunch data:', error);
		return true;
	}
}

async function auto_update() {
	await update();

	setInterval(update, updateTime);

	const now = new Date();
	const target = new Date();
	target.setHours(updateTimeTomorrow.hour, updateTimeTomorrow.minute, 0, 0);
	if (target <= now) target.setDate(target.getDate() + 1);
	const delay = target - now;

	setTimeout(async () => {
		await update();
		setInterval(update, 24 * 60 * 60 * 1000);
	}, delay);
}

function condition_today(time) {
	time = time || new Date();

	// true ? today : tomorrow
	const condition = time.getHours() < updateTimeTomorrow.hour || (time.getHours() == updateTimeTomorrow.hour && time.getMinutes() < updateTimeTomorrow.minute);

	return condition;
}

window.onload = auto_update;
