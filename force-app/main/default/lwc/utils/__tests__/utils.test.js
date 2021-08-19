
import { reduceErrors, getMergedArraysWithoutDuplicates, showToastNotification } from 'c/pdxUtils';
import { ShowToastEventName } from 'lightning/platformShowToastEvent';

describe('c-utils', () => {
    describe('reduceErrors', () => {
        it('reduces single error with message in body', () => {
            const FULL_ERROR = require('./data/singleError.json');
            const REDUCED_ERROR = FULL_ERROR.body.message;

            const reduced = reduceErrors(FULL_ERROR);

            expect(reduced).toStrictEqual(REDUCED_ERROR);
        });

        it('reduces single error with multiple messages in body', () => {
            const FULL_ERROR = require('./data/singleErrorWithMultipleMessagesInBody.json');
            const REDUCED_ERROR = `${FULL_ERROR.body[0].message}. ${FULL_ERROR.body[1].message}`;

            const reduced = reduceErrors(FULL_ERROR);

            expect(reduced).toStrictEqual(REDUCED_ERROR);
        });

        it('reduces single error message string', () => {
            const FULL_ERROR = require('./data/singleErrorMessage.json');
            const REDUCED_ERROR = FULL_ERROR.message;

            const reduced = reduceErrors(FULL_ERROR);

            expect(reduced).toStrictEqual(REDUCED_ERROR);
        });

        it('reduces array of error message string', () => {
            const FULL_ERROR = require('./data/arrayOfErrorMessages.json');
            const REDUCED_ERROR = `${FULL_ERROR[0].message}. ${FULL_ERROR[1].message}`;

            const reduced = reduceErrors(FULL_ERROR);

            expect(reduced).toStrictEqual(REDUCED_ERROR);
        });

        it('reduces single error with unknown shape', () => {
            const FULL_ERROR = require('./data/errorWithUnknownShape.json');
            const REDUCED_ERROR = FULL_ERROR.statusText;

            const reduced = reduceErrors(FULL_ERROR);

            expect(reduced).toStrictEqual(REDUCED_ERROR);
        });
    });

    describe('showToastNotification', () => {
        it('shows custom toast events with provided title, message and variant', () => {
            const TOAST_TITLE = 'The Title';
            const TOAST_MESSAGE = 'The Message';
            const TOAST_VARIANT = 'warning';

            // Mock handler for toast event
            const handler = jest.fn();

            // Add event listener to catch toast event
            window.addEventListener(ShowToastEventName, handler);

            showToastNotification(TOAST_TITLE, TOAST_MESSAGE, TOAST_VARIANT);

            return Promise.resolve().then(() => {
                // Check if toast event has been fired
                expect(handler).toHaveBeenCalled();
                expect(handler.mock.calls[0][0].detail.title).toBe(TOAST_TITLE);
                expect(handler.mock.calls[0][0].detail.message).toBe(TOAST_MESSAGE);
                expect(handler.mock.calls[0][0].detail.variant).toBe(TOAST_VARIANT);
            });
        });
    });

    describe('getMergedArraysWithoutDuplicates', () => {
        it('merge a bunch of arrays into one and remove duplicates', () => {
            const array1 = [1, 2, 3];
            const array2 = ['a', 'b', 'c'];
            const array3 = [1, 2, 'a', 6, 'c', 9, 'k', 4, 3, { mockKey : undefined }];

            const arrayForMatching = [1, 2, 3, 'a', 'b', 'c', 6, 9, 'k', 4, { mockKey : undefined }];

            expect(getMergedArraysWithoutDuplicates(array1, array2, array3)).toEqual(
                expect.arrayContaining(arrayForMatching)
            );
        });
    });
});