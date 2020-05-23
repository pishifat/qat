import Axios from 'axios';

const postData = {
    methods: {
        async executePost(path, data, e) {
            if (e) e.target.disabled = true;

            $(`[data-toggle='tooltip']`).tooltip('hide');

            try {
                const res = await Axios.post(path, data);

                if (res.data.error) {
                    this.$store.dispatch('updateToastMessages', { message: res.data.error });

                    return { error: res.data.error };
                } else {
                    return res.data;
                }
            } catch (error) {
                this.$store.dispatch('updateToastMessages', { message: 'Something went wrong!' });

                return { error: 'Something went wrong' };
            } finally {
                if (e) e.target.disabled = false;
            }
        },
        async executeGet(path, e) {
            if (e) e.target.disabled = true;

            $(`[data-toggle='tooltip']`).tooltip('hide');

            try {
                const res = await Axios(path);

                if (res.data.error) {
                    this.$store.dispatch('updateToastMessages', { message: res.data.error });

                    return { error: res.data.error };
                } else {
                    return res.data;
                }
            } catch (error) {
                this.$store.dispatch('updateToastMessages', { message: 'Something went wrong!' });

                return { error: 'Something went wrong' };
            } finally {
                if (e) e.target.disabled = false;
            }
        },
    },
};

export default postData;
