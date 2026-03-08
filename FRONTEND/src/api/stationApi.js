import api from "./axios";

const stationApi = {
	nearby: (lng, lat, radiusKm, facilities) => {
		const params = { lng, lat, radiusKm };
		if (facilities) {
			// allow array or comma string
			params.facilities = Array.isArray(facilities) ? facilities.join(",") : facilities;
		}

		return api.get("/service-stations/nearby", { params }).then((res) => {
			const d = res.data;
			if (Array.isArray(d)) return d;
			if (d?.stations) return d.stations;
			return d;
		});
	},

	// fetch single station details
	details: (id) =>
		api.get(`/service-stations/${id}`).then((res) => {
			const d = res.data;
			// backend returns { station, reports } — normalize to station object
			if (d?.station) return d.station;
			return d;
		}),
};

export default stationApi;
