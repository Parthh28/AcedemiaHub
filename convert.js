const fs = require('fs');
const files = [
  'admin-dashboard.html', 'browse.html', 'buyer-dashboard.html', 'cart.html', 
  'checkout.html', 'details.html', 'index.html', 'login.html', 
  'seller-dashboard.html', 'settings.html', 'upload.html', 'js/app.js'
];

function convertToRupeeString(numStr) {
    const rawNum = parseFloat(numStr.replace(/,/g, ''));
    const converted = rawNum * 83;
    
    // Formatting back
    let formatted;
    if (numStr.includes('.')) {
        formatted = converted.toFixed(2);
    } else {
        formatted = Math.round(converted).toString();
    }
    // Add commas
    const parts = formatted.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return '₹' + parts.join('.');
}

files.forEach(f => {
    if (!fs.existsSync(f)) return;
    let content = fs.readFileSync(f, 'utf-8');
    
    // Replace $$ {...} with ₹${...}
    content = content.replace(/\$\$\{/g, '₹${');
    
    // Replace $12.34
    content = content.replace(/\$([0-9,]+(?:\.[0-9]+)?)/g, (match, p1) => {
        return convertToRupeeString(p1);
    });

    // Handle string formatting in JS: '$' + note.price -> '₹' + note.price
    content = content.replace(/'\$' \+ /g, "'₹' + ");
    content = content.replace(/\"\\$\" \+ /g, '"₹" + ');
    
    // Also change occurrences of 'dollars' to 'rupees' if any
    content = content.replace(/dollars/gi, 'rupees');

    fs.writeFileSync(f, content);
});

// Now update numeric values in app.js
let appJs = fs.readFileSync('js/app.js', 'utf-8');
// Multiply hardcoded numbers in app.js objects by 83
// E.g. price: 8.99, earnings: 245.50
appJs = appJs.replace(/(price|earnings|balance):\s*([0-9]+(?:\.[0-9]+)?)/g, (match, key, val) => {
    let num = parseFloat(val) * 83;
    return `${key}: ${num.toFixed(2)}`;
});

fs.writeFileSync('js/app.js', appJs);

console.log('Conversion script finished successfully.');
