<template>
    <div>
        <h5 v-if="veto.reasons.length == 1">Veto consensus: <span :class="upholdMediations.length > withdrawMediations.length ? 'text-success' : 'text-danger'">{{ upholdMediations.length > withdrawMediations.length ? 'upheld' : 'dismissed' }}</span></h5>
        <h5 v-else>Veto reason #{{ reasonIndex+1 }} of {{ veto.reasons.length }} - <span :class="upholdMediations.length > withdrawMediations.length ? 'text-success' : 'text-danger'"></span>{{ upholdMediations.length > withdrawMediations.length ? 'upheld' : 'dismissed' }}</h5>
        <div class="card card-body small mb-4">
            <a :href="reason.link" target="_blank" class="mb-2">{{ reason.summary }}</a>
            <div v-if="upholdMediations.length > withdrawMediations.length">
                <div v-for="(mediation, i) in upholdMediations" :key="mediation.id">
                    <div class="mb-2">
                        <b>User {{ i + 1 }} - {{ mediation.vote === 2 ? 'partially agree' : 'agree' }}:</b>
                        <div class="pre-line">{{ mediation.comment }}</div>
                    </div>
                </div>
            </div>

            <div v-else>
                <div v-for="(mediation, i) in withdrawMediations" :key="mediation.id">
                    <div class="mb-2">
                        <b>User {{ i + 1 }} - {{ mediation.vote === 2 ? 'partially agree' : 'disagree' }}:</b>
                        <div class="pre-line">{{ mediation.comment }}</div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>

export default {
    name: 'VetoPartSummary',
    props: {
        veto: {
            type: Object,
            required: true,
        },
        reasonIndex: {
            type: Number,
            default: 0,
        },
    },
    computed: {
        reason () {
            return this.veto.reasons[this.reasonIndex];
        },
        shuffledMediations () {
            let shuffled = this.veto.mediations.filter(m => m.vote && m.reasonIndex == this.reasonIndex);

            for (let i = shuffled.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
            }

            return shuffled;
        },
        upholdMediations () {
            return this.veto.mediations.filter(mediation => mediation.vote && mediation.reasonIndex == this.reasonIndex && mediation.vote !== 3);
        },
        withdrawMediations () {
            return this.veto.mediations.filter(mediation => mediation.vote && mediation.reasonIndex == this.reasonIndex && mediation.vote !== 1);
        },
    },
};
</script>
