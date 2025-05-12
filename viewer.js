// 更新間隔：每 2 小時重新取得菜單
const updateTime = 2 * 60 * 60 * 1 * 1000;
// 排程每日固定 12:30 點執行重新載入
const updateTimeTomorrow = { hour: 12, minute: 30 };

const menu = document.getElementById("menu");
const ingredients = document.getElementById("ingredients");
const menu_title = document.querySelector(".menu_title");

/**showLunchData
 * 取得午餐菜色資料
 * @param {number} day - 0: 今天, 1: 明天
 * @param {string|null} schoolId - 校方 ID, 預設為 null
 * @param {string|null} kitchenId - 廚房 ID, 預設為 null
 * @returns {Array|null} - 菜色資料陣列或 null
 */
async function getLunch(day, schoolId = null, kitchenId = null) {
	try {
		// 先取得 BatchDataId，如傳入為 null 則會自動補入預設日期、校方與廚房
		const BatchDataId = await getBatchDataId(
			null,
			null,
			day,
			schoolId,
			kitchenId
		);

		if (!BatchDataId) return (menu.innerHTML = "不供餐");
		// 取得該批次的菜色資料
		const LunchDishes = await getDishesData(BatchDataId);
		return LunchDishes;
	} catch (error) {
		// 發生錯誤時回傳 null
		return null;
	}
}

/**
 * 顯示午餐菜色資料
 * @param {Array} dishes - 菜色資料陣列
 */
async function showLunchData(dishes) {
	try {
		// 清空舊有菜單顯示
		menu.innerHTML = "";

		if (!dishes) return;

		const Dishes = dishes;
		// 遍歷菜色清單並動態建立 UI 元素
		Dishes.forEach(function (DishData) {
			const type = DishData.DishType;
			const name = DishData.DishName;
			const id = DishData.DishId;

			if (type === undefined) return;

			// 建立菜色容器、圖片與資訊區塊
			const dish = document.createElement("div");
			const pic = document.createElement("div");
			const info = document.createElement("div");

			dish.className = "dish";
			pic.className = "pic";
			info.className = "info";

			menu.appendChild(dish);
			dish.appendChild(pic);

			const line = document.createElement("div");
			line.className = "line";
			dish.appendChild(line);

			dish.appendChild(info);

			// 設定屬性以便後續點擊事件存取
			dish.setAttribute("dishId", id);
			dish.setAttribute("dishType", type);

			const dish_pic = document.createElement("img");
			dish_pic.src = "https://fatraceschool.k12ea.gov.tw/dish/pic/" + id;
			pic.appendChild(dish_pic);

			info.innerHTML = `<p>${type}<br>${name}</p>`;

			dish.addEventListener("click", async function () {
				// 點擊後先清空舊食材列表
				ingredients.innerHTML = "";
				// 根據現在時間決定要查「今天(0)」或「明天(1)」
				let day = condition_today() ? 0 : 1;
				// 再次取得對應餐期的 BatchDataId 以查詢食材
				const ingerdientsData = await getDishIngredients(
					await getBatchDataId(null, null, day, SchoolId, KitchenId),
					id
				);

				let m = 0;
				// 動態產生食材列表並交替底色
				ingerdientsData.forEach(function (i) {
					m++;
					const ingredient = document.createElement("div");
					const name = document.createElement("div");
					const origin = document.createElement("div");
					const supplier = document.createElement("div");

					ingredient.className = "ingredient";
					name.className = "cell name";
					supplier.className = "cell supplier";
					origin.className = "cell origin";

					name.innerHTML = i.IngredientName;
					supplier.innerHTML = i.SupplierName;
					origin.innerHTML = i.IngredientSourceNameList;

					ingredients.appendChild(ingredient);
					ingredient.appendChild(name);
					ingredient.appendChild(supplier);
					ingredient.appendChild(origin);

					if (m % 2 === 1) {
						// 奇數列底色
						ingredient.style = "background-color: aqua;";
					} else {
						// 偶數列底色
						ingredient.style = "background-color: aliceblue;";
					}

					if (!(m === ingerdientsData.length))
						ingredients.appendChild(document.createElement("hr"));
				});
			});
		});

		return;
	} catch (error) {
		// 隱藏錯誤並中止顯示
		return;
	}
}

/**
 * 更新菜單顯示
 */
async function update() {
	try {
		ingredients.innerHTML = "";

		// 如果現在時間還在今日範圍（如 <12:30），顯示「今日午餐」
		if (condition_today()) {
			menu_title.innerHTML = "今日午餐菜單";
			menu_title.style = "background-color: green; border-color: green;";

			const dishes = await getLunch(0);
			return await showLunchData(dishes);
		}
		// 否則視為「明日午餐」，先根據新的日期物件加一天
		let nextDate = new Date(); // 避免直接操作全域時間
		nextDate.setDate(nextDate.getDate() + 1);

		menu_title.innerHTML = "明日午餐菜單";
		menu_title.style = "background-color: red; border-color: red;";

		const dishes = await getLunch(1);
		return await showLunchData(dishes);
	} catch (error) {
		console.error("Error updating lunch data:", error);
	}
}

/**
 * 自動更新功能
 */
async function auto_update() {
	// 第一次載入時立即執行一次更新
	await update();
	// 之後每隔 updateTime 重複執行
	setInterval(update, updateTime);

	// 計算從現在到明日 12:30 的延遲，第一次執行完後再以 24 小時間隔
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

/**
 * 判斷是否為今天
 * @returns {boolean} - 若當前時間早於設定的明日更新時間，回傳 true（代表還是「今天」）
 */
function condition_today() {
	const time = new Date();

	// true ? today : tomorrow
	const condition =
		time.getHours() < updateTimeTomorrow.hour ||
		(time.getHours() == updateTimeTomorrow.hour &&
			time.getMinutes() < updateTimeTomorrow.minute);

	return condition;
}

// 頁面載入時啟動自動更新
window.onload = auto_update;
