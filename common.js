let SchoolId = 64738252;
let KitchenId = 7743;

function getDate(day) {
	// 根據傳入的 day 差值計算對應年月日
	const today = new Date();
	const date = new Date();
	date.setDate(today.getDate() + day);

	return {
		year: date.getFullYear(),
		month: date.getMonth() + 1,
		day: date.getDate(),
	};
}

async function getBatchDataId(year, month, day, schoolId, kitchenId) {
	try {
		// 如未提供完整年月日，呼叫 getDate 自動補值
		if (!year || !month || !day) {
			const date = getDate(day);
			year = date.year;
			month = date.month;
			day = date.day;
		}

		// 使用傳入或全域預設的 SchoolId、KitchenId
		schoolId = schoolId || SchoolId;
		kitchenId = kitchenId || KitchenId;

		// 組成 API 查詢字串 (廚房、菜單類型、日期、學校)
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
			return null;
		}

		return Data.data[0].BatchDataId.toString();
	} catch (error) {
		console.error("Error fetching BatchDataId:", error);
		return null;
	}
}

async function getDishesData(BatchDataId) {
	try {
		// 若未提供 BatchDataId，則自動呼叫一遍以取得預設值
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

async function getDishIngredients(BatchDataId, DishId) {
	// 必須同時提供 BatchDataId 與 DishId，否則回傳 null
	if (!DishId || !BatchDataId) return null;

	try {
		// 傳入餐期與菜色參數以取得食材來源清單
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
