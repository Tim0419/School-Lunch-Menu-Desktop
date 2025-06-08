let SchoolId = 64738252;
let KitchenId = 7743;

/**
 * getDate
 * @param {number} day The distance between the target day and today. 目標日期與今日的距離
 * @returns {json} The result 結果
 */
function getDate(day) {
	const today = new Date();
	const date = new Date();
	date.setDate(today.getDate() + day);

	return {
		year: date.getFullYear(),
		month: date.getMonth() + 1,
		day: date.getDate(),
	};
}

/**
 * getBatchDataId
 * @param {number, null} year
 * @param {number, null} month
 * @param {number, null} day
 * @param {string, null} schoolId
 * @param {string, null} kitchenId
 * @returns {string} BatchDataId
 */
async function getBatchDataId(year, month, day, schoolId, kitchenId) {
	try {
		if (!year || !month || !day) {
			const date = getDate(day);
			year = date.year;
			month = date.month;
			day = date.day;
		}

		schoolId = schoolId || SchoolId;
		kitchenId = kitchenId || KitchenId;

		const params = new URLSearchParams({
			KitchenId: kitchenId || "all",
			MenuType: 1,
			period: `${year}-${month}-${day}`,
			SchoolId: schoolId,
		});

		const response = await fetch(
			"https://fatraceschool.k12ea.gov.tw/offered/meal?" + params.toString(),
			{
				method: "GET",
			}
		);

		const Data = await response.json();

		if (Data.data.length === 0) {
			return "";
		}

		return Data.data[0].BatchDataId.toString();
	} catch (error) {
		console.error("Error fetching BatchDataId:", error);
		return "ERROR";
	}
}

/**
 * getDishesData
 * @param {string, null} BatchDataId
 * @returns {Array} The data of each dish 餐點資料
 */
async function getDishesData(BatchDataId) {
	try {
		BatchDataId = BatchDataId || (await getBatchDataId());

		const response = await fetch(
			`https://fatraceschool.k12ea.gov.tw/dish?BatchDataId=${BatchDataId}`,
			{
				method: "GET",
			}
		);

		const Data = await response.json();

		const Dishes = Data.data.map((dish) => {
			return {
				DishType: dish.DishType,
				DishName: dish.DishName,
				DishId: dish.DishId,
			};
		});

		return Dishes;
	} catch (error) {
		console.error("Error fetching DishesData:", error);
		return null;
	}
}

/**
 * getDishIngredients
 * @param {string} BatchDataId
 * @param {string} DishId
 * @returns {Array} The information of each dish's ingredients.餐點成分資訊
 */
async function getDishIngredients(BatchDataId, DishId) {
	if (!DishId || !BatchDataId) return null;

	try {
		const params = new URLSearchParams({
			BatchDataId: BatchDataId,
			DishId: DishId,
		});

		const response = await fetch(
			`https://fatraceschool.k12ea.gov.tw/ingredient?` + params.toString(),
			{
				method: "GET",
			}
		);

		const Data = await response.json();

		return Data.data;
	} catch (error) {}
}
