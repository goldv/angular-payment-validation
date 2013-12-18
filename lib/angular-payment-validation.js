angular.module('payment.validation',[])

angular.module('payment.validation').factory('PaymentValidation', function(){

    $.fn.setCursorPosition = function(pos) {
        this.each(function(index, elem) {
            if (elem.setSelectionRange) {
                elem.setSelectionRange(pos, pos);
            } else if (elem.createTextRange) {
                var range = elem.createTextRange();
                range.collapse(true);
                range.moveEnd('character', pos);
                range.moveStart('character', pos);
                range.select();
            }
        });
        return this;
    };

    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; }

    var defaultFormat = /(\d{1,4})/g;

    var cards = [
        {
            type: 'maestro',
            pattern: /^(5018|5020|5038|6304|6759|676[1-3])/,
            format: defaultFormat,
            length: [12, 13, 14, 15, 16, 17, 18, 19],
            cvcLength: [3],
            luhn: true
        }, {
            type: 'dinersclub',
            pattern: /^(36|38|30[0-5])/,
            format: defaultFormat,
            length: [14],
            cvcLength: [3],
            luhn: true
        }, {
            type: 'laser',
            pattern: /^(6706|6771|6709)/,
            format: defaultFormat,
            length: [16, 17, 18, 19],
            cvcLength: [3],
            luhn: true
        }, {
            type: 'jcb',
            pattern: /^35/,
            format: defaultFormat,
            length: [16],
            cvcLength: [3],
            luhn: true
        }, {
            type: 'unionpay',
            pattern: /^62/,
            format: defaultFormat,
            length: [16, 17, 18, 19],
            cvcLength: [3],
            luhn: false
        }, {
            type: 'discover',
            pattern: /^(6011|65|64[4-9]|622)/,
            format: defaultFormat,
            length: [16],
            cvcLength: [3],
            luhn: true
        }, {
            type: 'mastercard',
            pattern: /^5[1-5]/,
            format: defaultFormat,
            length: [16],
            cvcLength: [3],
            luhn: true
        }, {
            type: 'amex',
            pattern: /^3[47]/,
            format: /(\d{1,4})(\d{1,6})?(\d{1,5})?/,
            length: [15],
            cvcLength: [3, 4],
            luhn: true
        }, {
            type: 'visa',
            pattern: /^4/,
            format: defaultFormat,
            length: [13, 14, 15, 16],
            cvcLength: [3],
            luhn: true
        }
    ];

    var allTypes = (function() {
        var _i, _len, _results, card;
        _results = [];
        for (_i = 0, _len = cards.length; _i < _len; _i++) {
            card = cards[_i];
            _results.push(card.type);
        }
        return _results;
    })();

    var luhnCheck = function(num) {
        var digit, digits, odd, sum, _i, _len;
        odd = true;
        sum = 0;
        digits = (num + '').split('').reverse();
        for (_i = 0, _len = digits.length; _i < _len; _i++) {
            digit = digits[_i];
            digit = parseInt(digit, 10);
            if ((odd = !odd)) {
                digit *= 2;
            }
            if (digit > 9) {
                digit -= 9;
            }
            sum += digit;
        }
        return sum % 10 === 0;
    };


    return {
        allTypes: allTypes,
        cardFromNumber : function(num) {
            var card, _i, _len;
            num = (num + '').replace(/\D/g, '');
            for (_i = 0, _len = cards.length; _i < _len; _i++) {
                card = cards[_i];
                if (card.pattern.test(num)) {
                    return card;
                }
            }
        },
        checkLength : function(number) {
            var card = this.cardFromNumber(number);
            if (card) {
                return number.length <= card.length[card.length.length - 1];
            } else {
                return number.length <= 16;
            }
        },
        checkNumeric : function(number){
            return /^[\d]+$/.test(number)
        },
        cardType : function(num) {
            var _ref;
            if (!num) {
                return null;
            }
            return ((_ref = this.cardFromNumber(num)) != null ? _ref.type : void 0) || null;
        },
        formatCardNumber : function(num) {
            var card, groups, upperLength, _ref;
            card = this.cardFromNumber(num);
            if (!card) {
                return num;
            }
            upperLength = card.length[card.length.length - 1];
            num = num.replace(/\D/g, '');
            num = num.slice(0, +upperLength + 1 || 9e9);
            if (card.format.global) {
                return (_ref = num.match(card.format)) != null ? _ref.join(' ') : void 0;
            } else {
                groups = card.format.exec(num);
                if (groups != null) {
                    groups.shift();
                }
                return groups != null ? groups.join(' ') : void 0;
            }
        },
        validateCardNumber : function(num) {
            var card, _ref;
            num = (num + '').replace(/\s+|-/g, '');
            if (!/^\d+$/.test(num)) {
                return false;
            }
            card = this.cardFromNumber(num);
            if (!card) {
                return false;
            }
            return (_ref = num.length, __indexOf.call(card.length, _ref) >= 0) && (card.luhn === false || luhnCheck(num));
        }
    }
})

angular.module('payment.validation').directive('paymentCardNumber',['PaymentValidation', function(validator) {

        return {
            require: 'ngModel',
            link: function(scope, element, attrs, ctrl) {

                var revert = function(value){
                    var prevSelection = element.prop('selectionStart') - 1
                    ctrl.$viewValue = value
                    ctrl.$render()
                    element.setCursorPosition(prevSelection)
                }

                var format = function(viewValue){
                    var formatted = validator.formatCardNumber(viewValue).trim()
                    if(formatted != viewValue){
                        ctrl.$viewValue = formatted
                        ctrl.$render()
                        return formatted
                    }else{
                        return viewValue
                    }
                }

                var setCardType = function(value){
                    var cardType =  validator.cardType(value) || 'unknown';
                    element.addClass(cardType)

                    element.removeClass('unknown');
                    element.removeClass(validator.allTypes.join(' '));
                    element.addClass(cardType);
                    element.toggleClass('identified', cardType !== 'unknown');
                }

                var validate = function(value){
                    if (validator.validateCardNumber(value)) {
                        // it is valid
                        ctrl.$setValidity('cardNumber', true);
                    } else {
                        // it is invalid
                        ctrl.$setValidity('cardNumber', false);
                    }
                }

                ctrl.$parsers.unshift(function(viewValue) {

                    if(viewValue == "")return viewValue

                    // strip white space
                    var cardNum = viewValue.replace(/\s/g, "");

                    // revert to previous value if validity checks fail
                    if(!validator.checkLength(cardNum) || !validator.checkNumeric(cardNum)){
                        var revertedValue = ctrl.$modelValue || ""
                        revert(revertedValue)
                        return revertedValue
                    }

                    // If we aren't appending, don't attempt to format
                    if ((element.prop('selectionStart') != null) && element.prop('selectionStart') !== viewValue.length) {
                        return viewValue;
                    }

                    // format the number and update the view if need be
                    cardNum = format(viewValue)

                    // sets appropriate class on the element if we can derive the card type
                    setCardType(cardNum)

                    // validate the number
                    validate(cardNum)

                    return cardNum;
                })
            }
        }
    }])
