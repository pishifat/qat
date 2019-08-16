const postData = {
    methods: {
        async executePost(path, data, e) {
            if (e) e.target.disabled = true;

            try {
                const res = await axios.post(path, data);
                if (e) e.target.disabled = false;
                return res.data;
            } catch (error) {
                if (e) e.target.disabled = false;
                return { error: 'Something went wrong' };
            }
        },
        async executeGet(path, e) {
            if (e) e.target.disabled = true;

            try {
                const res = await axios(path);
                if (e) e.target.disabled = false;
                return res.data;
            } catch (error) {
                if (e) e.target.disabled = false;
                return { error: 'Something went wrong' };
            }
        },
    },
};

export default postData;
