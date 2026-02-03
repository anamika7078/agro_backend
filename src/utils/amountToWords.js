/**
 * Convert amount to Indian Rupees in words
 * @param {number} amount - The amount to convert
 * @returns {string} - Amount in words
 */
const amountToWords = (amount) => {
    if (!amount || amount === 0) return 'Zero Rupees Only';

    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];

    const convertLessThanOneThousand = (num) => {
        let words = '';

        if (num >= 100) {
            words += ones[Math.floor(num / 100)] + ' Hundred ';
            num %= 100;
        }

        if (num >= 20) {
            words += tens[Math.floor(num / 10)] + ' ';
            num %= 10;
        }

        if (num >= 10) {
            words += teens[num - 10] + ' ';
        } else if (num > 0) {
            words += ones[num] + ' ';
        }

        return words.trim();
    };

    const convert = (num) => {
        if (num === 0) return 'Zero';

        let words = '';

        // Crores
        if (num >= 10000000) {
            words += convertLessThanOneThousand(Math.floor(num / 10000000)) + ' Crore ';
            num %= 10000000;
        }

        // Lakhs
        if (num >= 100000) {
            words += convertLessThanOneThousand(Math.floor(num / 100000)) + ' Lakh ';
            num %= 100000;
        }

        // Thousands
        if (num >= 1000) {
            words += convertLessThanOneThousand(Math.floor(num / 1000)) + ' Thousand ';
            num %= 1000;
        }

        // Hundreds and below
        if (num > 0) {
            words += convertLessThanOneThousand(num);
        }

        return words.trim();
    };

    // Split into rupees and paise
    const rupees = Math.floor(amount);
    const paise = Math.round((amount - rupees) * 100);

    let result = convert(rupees) + ' Rupees';

    if (paise > 0) {
        result += ' and ' + convert(paise) + ' Paise';
    }

    result += ' Only';

    return result.charAt(0).toUpperCase() + result.slice(1);
};

module.exports = amountToWords;
