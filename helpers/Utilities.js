
class Utilities {

    static isPhoneNumber(phone) {
        // Regular expression to match phone numbers starting with +84, 84, or 0
        const phoneRegex = /^(?:\+84|84|0)\d{9}$/;
        
        // Test the phone number against the regex
        return phoneRegex.test(phone);
    }

    static delay(ms)
    {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    static datediff(first, second) {
        return Math.round((new Date(second) - new Date(first)) / (1000 * 60 * 60 * 24));
    }
}

module.exports = { Utilities };