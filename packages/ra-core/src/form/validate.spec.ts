import expect from 'expect';

import {
    required,
    minLength,
    maxLength,
    minValue,
    maxValue,
    number,
    regex,
    email,
    choices,
    composeValidators,
} from './validate';

describe('Validators', () => {
    const test = async (validator, inputs, message) => {
        const validationResults = await Promise.all<Error | undefined>(
            inputs.map(input => validator(input, null))
        ).then(results =>
            results.map(error =>
                error && error.message ? error.message : error
            )
        );

        expect(validationResults).toEqual(
            Array(...Array(inputs.length)).map(() => message)
        );
    };

    describe('composeValidators', () => {
        const asyncSuccessfullValidator = async =>
            new Promise(resolve => resolve());
        const asyncFailedValidator = async =>
            new Promise(resolve => resolve('async'));

        it('Correctly composes validators passed as an array', async () => {
            await test(
                composeValidators([
                    required(),
                    minLength(5),
                    asyncSuccessfullValidator,
                ]),
                [''],
                'ra.validation.required'
            );
            await test(
                composeValidators([
                    required(),
                    asyncSuccessfullValidator,
                    minLength(5),
                ]),
                ['abcd'],
                'ra.validation.minLength'
            );
            await test(
                composeValidators([
                    required(),
                    asyncFailedValidator,
                    minLength(5),
                ]),
                ['abcde'],
                'async'
            );
            await test(
                composeValidators([
                    required(),
                    minLength(5),
                    asyncSuccessfullValidator,
                ]),
                ['abcde'],
                undefined
            );
        });

        it('Correctly composes validators passed as many arguments', async () => {
            await test(
                composeValidators(
                    required(),
                    minLength(5),
                    asyncSuccessfullValidator
                ),
                [''],
                'ra.validation.required'
            );
            await test(
                composeValidators(
                    required(),
                    asyncSuccessfullValidator,
                    minLength(5)
                ),
                ['abcd'],
                'ra.validation.minLength'
            );
            await test(
                composeValidators(
                    required(),
                    asyncFailedValidator,
                    minLength(5)
                ),
                ['abcde'],
                'async'
            );
            await test(
                composeValidators(
                    required(),
                    minLength(5),
                    asyncSuccessfullValidator
                ),
                ['abcde'],
                undefined
            );
        });
    });

    describe('required', () => {
        it('should return undefined if the value is not empty', () => {
            test(required(), ['foo', 12, [1]], undefined);
        });
        it('should return an error message if the value is empty', () => {
            test(
                required(),
                [undefined, '', null, []],
                'ra.validation.required'
            );
        });
        it('should have a `isRequired` prop for allowing the UI to add a required marker', () => {
            expect(required().isRequired).toEqual(true);
        });
        it('should allow message to be a callback', () => {
            const message = jest.fn(() => 'ra.validation.required');
            test(
                required(message),
                [undefined, '', null, []],
                'ra.validation.required'
            );
            expect(message).toHaveBeenCalledTimes(4);
            expect(message).toHaveBeenLastCalledWith({
                args: undefined,
                value: [],
                values: null,
            });
        });
    });
    describe('minLength', () => {
        it('should return undefined if the value is empty', () => {
            test(minLength(5), [undefined, '', null], undefined);
        });
        it('should return undefined if the value is not a string', () => {
            test(minLength(5), [1234, 123456], undefined);
        });
        it('should return undefined if the value has equal or higher length than the given minimum', () => {
            test(minLength(5), ['12345', '123456'], undefined);
        });
        it('should return an error message if the value has smaller length than the given minimum', () => {
            test(minLength(5), ['1234', '12'], 'ra.validation.minLength');
        });
        it('should allow message to be a callback', () => {
            const message = jest.fn(() => 'ra.validation.minLength');
            test(
                minLength(5, message),
                ['1234', '12'],
                'ra.validation.minLength'
            );
            expect(message).toHaveBeenCalledTimes(2);
            expect(message).toHaveBeenLastCalledWith({
                args: { min: 5 },
                value: '12',
                values: null,
            });
        });
    });
    describe('maxLength', () => {
        it('should return undefined if the value is empty', () => {
            test(maxLength(5), [undefined, '', null], undefined);
        });
        it('should return undefined if the value is not a string', () => {
            test(maxLength(5), [1234, 123456], undefined);
        });
        it('should return undefined if the value has equal or smaller length than the given maximum', () => {
            test(maxLength(5), ['12345', '123'], undefined);
        });
        it('should return an error message if the value has higher length than the given maximum', () => {
            test(maxLength(10), ['12345678901'], 'ra.validation.maxLength');
        });
        it('should allow message to be a callback', () => {
            const message = jest.fn(() => 'ra.validation.maxLength');
            test(
                maxLength(10, message),
                ['12345678901'],
                'ra.validation.maxLength'
            );
            expect(message).toHaveBeenCalledTimes(1);
            expect(message).toHaveBeenLastCalledWith({
                args: { max: 10 },
                value: '12345678901',
                values: null,
            });
        });
    });
    describe('minValue', () => {
        it('should return undefined if the value is empty', () => {
            test(minValue(5), [undefined, '', null], undefined);
        });
        it('should return undefined if the value is equal or higher than the given minimum', () => {
            test(minValue(5), [5, 10, 5.5, '10'], undefined);
        });
        it('should return an error message if the value is lower than the given minimum', () => {
            test(minValue(10), [1, 9.5, '5'], 'ra.validation.minValue');
        });
        it('should return an error message if the value is 0', () => {
            test(minValue(10), [0], 'ra.validation.minValue');
        });
        it('should allow message to be a callback', () => {
            const message = jest.fn(() => 'ra.validation.minValue');
            test(minValue(10, message), [0], 'ra.validation.minValue');
            expect(message).toHaveBeenCalledTimes(1);
            expect(message).toHaveBeenLastCalledWith({
                args: { min: 10 },
                value: 0,
                values: null,
            });
        });
    });
    describe('maxValue', () => {
        it('should return undefined if the value is empty', () => {
            test(maxValue(5), [undefined, '', null], undefined);
        });
        it('should return undefined if the value is equal or less than the given maximum', () => {
            test(maxValue(5), [5, 4, 4.5, '4'], undefined);
        });
        it('should return an error message if the value is higher than the given maximum', () => {
            test(maxValue(10), [11, 10.5, '11'], 'ra.validation.maxValue');
        });
        it('should return undefined if the value is 0', () => {
            test(maxValue(10), [0], undefined);
        });
        it('should allow message to be a callback', () => {
            const message = jest.fn(() => 'ra.validation.maxValue');
            test(
                maxValue(10, message),
                [11, 10.5, '11'],
                'ra.validation.maxValue'
            );
            expect(message).toHaveBeenCalledTimes(3);
            expect(message).toHaveBeenLastCalledWith({
                args: { max: 10 },
                value: '11',
                values: null,
            });
        });
    });
    describe('number', () => {
        it('should return undefined if the value is empty', () => {
            test(number(), [undefined, '', null], undefined);
        });
        it('should return undefined if the value is a number', () => {
            test(number(), [123, '123', new Date(), 0, 2.5, -5], undefined);
        });
        it('should return an error message if the value is not a number', () => {
            test(number(), ['foo'], 'ra.validation.number');
        });
        it('should allow message to be a callback', () => {
            const message = jest.fn(() => 'ra.validation.number');
            test(number(message), ['foo'], 'ra.validation.number');
            expect(message).toHaveBeenCalledTimes(1);
            expect(message).toHaveBeenLastCalledWith({
                args: undefined,
                value: 'foo',
                values: null,
            });
        });
    });
    describe('regex', () => {
        it('should return undefined if the value is empty', () => {
            test(regex(/foo/, 'not foo'), [undefined, '', null], undefined);
        });
        it('should return undefined if the value is not a string', () => {
            test(regex(/foo/, 'not foo'), [1234, new Date()], undefined);
        });
        it('should return undefined if the value matches the pattern', () => {
            test(
                regex(/foo/, 'not foo'),
                ['foobar', 'barfoo', 'barfoobar', 'foofoo'],
                undefined
            );
        });
        it('should return an error message if the value does not match the pattern', () => {
            test(
                regex(/foo/, 'not foo'),
                ['bar', 'barfo', 'hello, world'],
                'not foo'
            );
        });

        it('should memoize the validator when the regex pattren and message are the same', () => {
            expect(regex(/foo/, 'placeholder')).toBe(
                regex(/foo/, 'placeholder')
            );
        });

        it('should create new validator when the regex pattren is different', () => {
            expect(regex(/foo/, 'placeholder')).not.toBe(
                regex(/notfoo/, 'placeholder')
            );
        });

        it('should create new validator when message is different', () => {
            expect(regex(/foo/, 'placeholder')).not.toBe(
                regex(/foo/, 'another placeholder')
            );
        });
    });
    describe('email', () => {
        it('should return undefined if the value is empty', () => {
            test(email(), [undefined, '', null], undefined);
        });
        it('should return undefined if the value is not a string', () => {
            test(email(), [1234, new Date()], undefined);
        });
        it('should return undefined if the value is a valid email', () => {
            test(
                email(),
                ['foo@bar.com', 'john.doe@mydomain.co.uk'],
                undefined
            );
        });
        it('should return an error if the value is not a valid email', () => {
            test(email(), ['foo@bar', 'hello, world'], 'ra.validation.email');
        });
    });
    describe('choices', () => {
        it('should return undefined if the value is empty', () => {
            test(choices([1, 2], 'error'), [undefined, '', null], undefined);
        });
        it('should return undefined if the value is in the choice list', () => {
            test(choices([1, 2], 'error'), [1, 2], undefined);
        });
        it('should return an error message if the value is not in the choice list', () => {
            test(choices([1, 2], 'error'), ['hello', 3], 'error');
        });
    });
});
