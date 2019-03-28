const postData = {
    methods: {
        executePost: async function(path, data, e) {
			if (e) e.target.disabled = true;

			try {
				const res = await axios.post(path, data);
				if (e) e.target.disabled = false;

				if (res.data.error) {
                    return res.data;
				} else {
					return res.data;
				}
			} catch (error) {
				if (e) e.target.disabled = false;
				return { error: 'Something went wrong' };
			}
		}
    }
}

export default postData;
