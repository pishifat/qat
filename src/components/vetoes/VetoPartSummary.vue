<template>
    <div>
        <h5 v-if="veto.reasons.length == 1">
            Veto consensus:
            <span :class="isUpheld ? 'text-success' : 'text-danger'">
                {{ isUpheld ? 'upheld' : 'dismissed' }}
            </span>
        </h5>
        <h5 v-else>
            Veto reason #{{ reasonIndex+1 }} of {{ veto.reasons.length }} -
            <span :class="isUpheld ? 'text-success' : 'text-danger'">
                {{ isUpheld ? 'upheld' : 'dismissed' }}
            </span>
        </h5>
        <div class="card card-body small mb-4">
            <div v-if="reason.link">
                <a :href="reason.link" target="_blank" class="mb-2">{{ reason.summary }}</a>
            </div>
            <div v-else>
                {{ reason.summary }}
            </div>
            <div v-if="isUpheld">
                <div v-for="mediation in upholdMediations" :key="mediation.id">
                    <div class="mb-2">
                        <b>Anonymous - {{ mediation.vote === 2 ? 'partially agree' : 'agree' }}:</b>
                        <div class="pre-line">{{ mediation.comment }}</div>
                    </div>
                </div>
            </div>
            <div v-else>
                <div v-for="mediation in withdrawMediations" :key="mediation.id">
                    <div class="mb-2">
                        <b>Anonymous - {{ mediation.vote === 2 ? 'partially agree' : 'disagree' }}:</b>
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
        isUpheld () {
            if (this.veto.vetoFormat >= 5) {
                const sum = this.upholdMediations.length + this.withdrawMediations.length;
                let threshold;

                if (this.veto.vetoFormat == 5) {
                    threshold = 0.7 * sum;
                }
                
                if (this.veto.vetoFormat == 6) {
                    threshold = 0.6 * sum;
                }

                if (this.veto.vetoFormat >= 7) {
                    return this.veto.reasons[this.reasonIndex].status == 'upheld';
                }

                return this.upholdMediations.length >= threshold;
            } else {
                return this.upholdMediations.length > this.withdrawMediations.length;
            }
        },
    },
};
</script>
