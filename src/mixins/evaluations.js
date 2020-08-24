import { BnEvaluationConsensus, AppEvaluationConsensus, ResignationConsensus, BnEvaluationAddition } from '../../shared/enums';

export default {
    computed: {
        consensusText () {
            return this.makeWordFromField(this.consensus);
        },
        additionText () {
            return this.makeWordFromField(this.addition);
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
        lowActivityWarning () {
            return this.addition === BnEvaluationAddition.LowActivityWarning;
        },
        noAddition () {
            return this.addition === BnEvaluationAddition.None;
        },
    },
    methods: {
        makeWordFromField (field) {
            if (!field) return 'none';

            let word = field.replace(/([a-zA-Z])([A-Z])([a-z])/g, '$1 $2$3');

            if (word.charAt(word.length-1) === 'n') word = word.replace(/.$/,'N'); // Bn --> BN

            return word;
        },
    },
};
