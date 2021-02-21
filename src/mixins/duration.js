export default {
    computed: {
        bnHistory () {
            return this.selectedUser.history.filter(h => h.group === 'bn');
        },
        natHistory () {
            return this.selectedUser.history.filter(h => h.group === 'nat');
        },
    },
    methods: {
        calculateDuration (group) {
            let days = group == 'bn' ? this.selectedUser.bnDuration : this.selectedUser.natDuration;
            let years = Math.floor(days / 365);
            let remainingDays = Math.round(days % 365);

            if (years > 0) {
                return `${years} ${years == 1 ? 'year' : 'years'}, ${remainingDays} days`;
            } else {
                return `${remainingDays} days`;
            }
        },
    },
};
