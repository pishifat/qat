import { BnEvaluationConsensus, AppEvaluationConsensus, ResignationConsensus } from '../../shared/enums';

export default {
    computed: {
        consensusText () {
            if (!this.consensus) return 'None';

            switch (this.consensus) {
                case 'fullBn':
                    return 'Full BN';
                case 'probationBn':
                    return 'Probation BN';
                case 'removeFromBn':
                    return 'Remove from BN';
                case 'resignedOnGoodTerms':
                    return 'Resigned on good terms';
                case 'resignedOnStandardTerms':
                    return 'Resigned on standard terms';
                default:
                    // Pass | Fail
                    return this.consensus.charAt(0).toUpperCase() + this.consensus.slice(1);
            }
        },
        additionText () {
            switch (this.addition) {
                case 'lowActivity':
                    return 'Low activity warning';
                default:
                    return 'None';
            }
        },
        consensusColor () {
            switch (this.consensus) {
                case 'pass':
                case 'fullBn':
                case 'resignedOnGoodTerms':
                    return 'text-pass';

                case 'fail':
                case 'removeFromBn':
                    return 'text-fail';

                case 'probationBn':
                    return 'text-probation';

                case 'resignedOnStandardTerms':
                    return 'text-neutral';

                default:
                    return '';
            }
        },
        positiveConsensus () {
            return this.consensus === AppEvaluationConsensus.Pass || this.consensus === BnEvaluationConsensus.FullBn || this.consensus === ResignationConsensus.ResignedOnGoodTerms;
        },
        neutralConsensus () {
            return this.consensus === ResignationConsensus.ResignedOnStandardTerms || this.consensus === BnEvaluationConsensus.ProbationBn;
        },
        negativeConsensus () {
            return this.consensus === AppEvaluationConsensus.Fail || this.consensus === BnEvaluationConsensus.RemoveFromBn;
        },
    },
    methods: {
        makeWordFromField (field) {
            return field.replace(/([a-zA-Z])([A-Z])([a-z])/g, '$1 $2$3');
        },
    },
};
