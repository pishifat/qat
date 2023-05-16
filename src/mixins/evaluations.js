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
                case 'remainInNat':
                case 'resignedOnGoodTerms':
                    return 'text-pass';

                case 'fail':
                case 'removeFromNat':
                case 'removeFromBn':
                case 'moveToBn':
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
        behaviorWarning () {
            return this.addition === BnEvaluationAddition.BehaviorWarning;
        },
        mapQualityWarning () {
            return this.addition === BnEvaluationAddition.MapQualityWarning;
        },
        moddingQualityWarning () {
            return this.addition === BnEvaluationAddition.ModdingQualityWarning;
        },
        noAddition () {
            return this.addition === BnEvaluationAddition.None;
        },
    },
    methods: {
        makeWordFromField (field) {
            if (!field) return 'none';

            // Bn --> BN
            let word = field.replace(/Bn/,'BN');
            // Nat --> NAT
            word = word.replace(/Nat/, 'NAT');
            // aWordWithBNOnIt --> a Word With BNOn It
            word = word.replace(/([a-z])([A-Z])/g, '$1 $2');
            // a Word With BNOn It --> a Word With BN On It
            word = word.replace(/([A-Z])([A-Z][a-z])/g, '$1 $2');
            // capitalize
            word = word.charAt(0).toUpperCase() + word.slice(1);

            return word;
        },
        capitalizeFirstLetter (string) {
            return string.charAt(0).toUpperCase() + string.slice(1);
        }
    },
};
