let predefinedItems = JSON.parse(localStorage.getItem("predefinedItems")) || [];
let invoiceItems = [];
let savedInvoices = JSON.parse(localStorage.getItem("savedInvoices")) || [];

function openTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.style.display = "none");
    document.getElementById(tabName).style.display = "block";
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector(`button[onclick="openTab('${tabName}')"]`).classList.add('active');
}

// Predefined Items Functions
function addPredefinedItem() {
    let name = document.getElementById('itemName').value;
    let batch = document.getElementById('batchNumber').value;
    let price = parseFloat(document.getElementById('itemPrice').value);
    let stock = parseInt(document.getElementById('itemStock').value);
    if (!name || !batch || isNaN(price) || isNaN(stock)) {
        alert("Please fill all fields correctly");
        return;
    }
    predefinedItems.push({ name, batch, price, stock, isEditing: false });
    localStorage.setItem("predefinedItems", JSON.stringify(predefinedItems));
    displayPredefinedItems();
    clearInputs('predefinedSection');
}

function displayPredefinedItems() {
    let table = document.getElementById('predefinedTable');
    table.innerHTML = `
        <thead>
            <tr>
                <th>Name</th>
                <th>Batch</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Actions</th>
            </tr>
        </thead>
        <tbody>`;
    predefinedItems.forEach((item, index) => {
        table.innerHTML += `
            <tr>
                <td>${item.isEditing ? `<input type="text" class="form-control" value="${item.name}" id="editName${index}">` : item.name}</td>
                <td>${item.isEditing ? `<input type="text" class="form-control" value="${item.batch}" id="editBatch${index}">` : item.batch}</td>
                <td>${item.isEditing ? `<input type="number" class="form-control" value="${item.price}" id="editPrice${index}" step="0.01">` : item.price.toFixed(2)}</td>
                <td>${item.isEditing ? `<input type="number" class="form-control" value="${item.stock}" id="editStock${index}">` : item.stock}</td>
                <td>
                    ${item.isEditing ? 
                        `<button class="btn btn-success btn-sm" onclick="savePredefinedItem(${index})">Save</button>
                         <button class="btn btn-secondary btn-sm" onclick="cancelEditPredefined(${index})">Cancel</button>` :
                        `<button class="btn btn-primary btn-sm" onclick="editPredefinedItem(${index})">Edit</button>`}
                    <button class="btn btn-danger btn-sm" onclick="deletePredefinedItem(${index})">Delete</button>
                </td>
            </tr>`;
    });
    table.innerHTML += `</tbody>`;
}

function editPredefinedItem(index) {
    predefinedItems[index].isEditing = true;
    displayPredefinedItems();
}

function savePredefinedItem(index) {
    const updatedItem = {
        name: document.getElementById(`editName${index}`).value,
        batch: document.getElementById(`editBatch${index}`).value,
        price: parseFloat(document.getElementById(`editPrice${index}`).value),
        stock: parseInt(document.getElementById(`editStock${index}`).value),
        isEditing: false
    };
    if (!updatedItem.name || !updatedItem.batch || isNaN(updatedItem.price) || isNaN(updatedItem.stock)) {
        alert("Please enter valid values");
        return;
    }
    predefinedItems[index] = updatedItem;
    localStorage.setItem("predefinedItems", JSON.stringify(predefinedItems));
    displayPredefinedItems();
}

function cancelEditPredefined(index) {
    predefinedItems[index].isEditing = false;
    displayPredefinedItems();
}

function deletePredefinedItem(index) {
    predefinedItems.splice(index, 1);
    localStorage.setItem("predefinedItems", JSON.stringify(predefinedItems));
    displayPredefinedItems();
}

// Invoice Section Functions
function searchInvoiceItem() {
    let searchValue = document.getElementById('invoiceSearchItem').value.toLowerCase();
    let filteredItems = predefinedItems.filter(item => item.name.toLowerCase().includes(searchValue));
    document.getElementById('invoiceItemList').innerHTML = filteredItems.map(item =>
        `<li class="list-group-item" onclick="selectInvoiceItem('${item.name}', '${item.batch}', ${item.price})">
            ${item.name} - ${item.batch} - PKR ${item.price.toFixed(2)} (Stock: ${item.stock})
        </li>`).join('');
}

function selectInvoiceItem(name, batch, price) {
    document.getElementById('invoiceItemName').value = name;
    document.getElementById('invoiceBatchNo').value = batch;
    document.getElementById('invoicePrice').value = price.toFixed(2);
    document.getElementById('invoiceQty').value = 1;
    document.getElementById('invoiceDiscount').value = 0;
    calculateTotal();
}

function calculateTotal() {
    const price = parseFloat(document.getElementById('invoicePrice').value) || 0;
    const qty = parseInt(document.getElementById('invoiceQty').value) || 0;
    const discountPercent = parseFloat(document.getElementById('invoiceDiscount').value) || 0;
    const subtotal = price * qty;
    const discountAmount = (subtotal * discountPercent) / 100;
    // No need to display total here as it's just for preview
}

function addItemToInvoice() {
    let name = document.getElementById('invoiceItemName').value;
    let batch = document.getElementById('invoiceBatchNo').value;
    let price = parseFloat(document.getElementById('invoicePrice').value);
    let qty = parseInt(document.getElementById('invoiceQty').value);
    let discountPercent = parseFloat(document.getElementById('invoiceDiscount').value) || 0;
    
    const itemIndex = predefinedItems.findIndex(item => item.name === name && item.batch === batch);
    if (itemIndex === -1 || isNaN(price) || isNaN(qty) || qty > predefinedItems[itemIndex].stock) {
        alert(`Please enter valid values${qty > predefinedItems[itemIndex]?.stock ? ' (Quantity exceeds stock)' : ''}`);
        return;
    }
    
    const subtotal = price * qty;
    const discountAmount = (subtotal * discountPercent) / 100;
    const total = subtotal - discountAmount;
    
    // Update stock
    predefinedItems[itemIndex].stock -= qty;
    localStorage.setItem("predefinedItems", JSON.stringify(predefinedItems));
    displayPredefinedItems();
    
    invoiceItems.push({ name, batch, price, qty, discountPercent, total, isEditing: false });
    updateInvoiceTable();
    clearInputs('invoiceSection');
}

function updateInvoiceTable() {
    let table = document.getElementById('invoiceTable');
    table.innerHTML = `
        <thead>
            <tr>
                <th>#</th>
                <th>Name</th>
                <th>Batch</th>
                <th>Price</th>
                <th>Qty</th>
                <th>Discount (%)</th>
                <th>Total</th>
                <th>Actions</th>
            </tr>
        </thead>
        <tbody>`;
    let grandTotal = 0;
    invoiceItems.forEach((item, index) => {
        grandTotal += item.total;
        table.innerHTML += `
            <tr>
                <td>${index + 1}</td>
                <td>${item.name}</td>
                <td>${item.batch}</td>
                <td>${item.isEditing ? `<input type="number" class="form-control" value="${item.price}" id="editInvPrice${index}" step="0.01" oninput="updateInvoiceTotal(${index})">` : item.price.toFixed(2)}</td>
                <td>${item.isEditing ? `<input type="number" class="form-control" value="${item.qty}" id="editInvQty${index}" oninput="updateInvoiceTotal(${index})">` : item.qty}</td>
                <td>${item.isEditing ? `<input type="number" class="form-control" value="${item.discountPercent}" id="editInvDiscount${index}" step="0.01" oninput="updateInvoiceTotal(${index})">` : item.discountPercent.toFixed(2)}</td>
                <td>${item.total.toFixed(2)}</td>
                <td>
                    ${item.isEditing ? 
                        `<button class="btn btn-success btn-sm" onclick="saveInvoiceItem(${index})">Save</button>
                         <button class="btn btn-secondary btn-sm" onclick="cancelEditInvoice(${index})">Cancel</button>` :
                        `<button class="btn btn-primary btn-sm" onclick="editInvoiceItem(${index})">Edit</button>`}
                    <button class="btn btn-danger btn-sm" onclick="deleteInvoiceItem(${index})">Delete</button>
                </td>
            </tr>`;
    });
    table.innerHTML += `</tbody>`;
    document.getElementById('grandTotal').innerText = `PKR ${grandTotal.toFixed(2)}`;
}

function updateInvoiceTotal(index) {
    const price = parseFloat(document.getElementById(`editInvPrice${index}`).value) || 0;
    const qty = parseInt(document.getElementById(`editInvQty${index}`).value) || 0;
    const discountPercent = parseFloat(document.getElementById(`editInvDiscount${index}`).value) || 0;
    const subtotal = price * qty;
    const discountAmount = (subtotal * discountPercent) / 100;
    invoiceItems[index].total = subtotal - discountAmount;
}

function editInvoiceItem(index) {
    invoiceItems[index].isEditing = true;
    updateInvoiceTable();
}

function saveInvoiceItem(index) {
    const originalQty = invoiceItems[index].qty;
    const updatedItem = {
        ...invoiceItems[index],
        price: parseFloat(document.getElementById(`editInvPrice${index}`).value),
        qty: parseInt(document.getElementById(`editInvQty${index}`).value),
        discountPercent: parseFloat(document.getElementById(`editInvDiscount${index}`).value) || 0,
        isEditing: false
    };
    
    const itemIndex = predefinedItems.findIndex(item => item.name === updatedItem.name && item.batch === updatedItem.batch);
    const stockDifference = originalQty - updatedItem.qty;
    
    if (isNaN(updatedItem.price) || isNaN(updatedItem.qty) || 
        (stockDifference < 0 && Math.abs(stockDifference) > predefinedItems[itemIndex].stock)) {
        alert(`Please enter valid values${stockDifference < 0 ? ' (Quantity exceeds available stock)' : ''}`);
        return;
    }
    
    const subtotal = updatedItem.price * updatedItem.qty;
    const discountAmount = (subtotal * updatedItem.discountPercent) / 100;
    updatedItem.total = subtotal - discountAmount;
    
    // Update stock
    predefinedItems[itemIndex].stock += stockDifference;
    localStorage.setItem("predefinedItems", JSON.stringify(predefinedItems));
    displayPredefinedItems();
    
    invoiceItems[index] = updatedItem;
    updateInvoiceTable();
}

function cancelEditInvoice(index) {
    invoiceItems[index].isEditing = false;
    updateInvoiceTable();
}

function deleteInvoiceItem(index) {
    const item = invoiceItems[index];
    const itemIndex = predefinedItems.findIndex(i => i.name === item.name && i.batch === item.batch);
    predefinedItems[itemIndex].stock += item.qty;
    localStorage.setItem("predefinedItems", JSON.stringify(predefinedItems));
    invoiceItems.splice(index, 1);
    updateInvoiceTable();
    displayPredefinedItems();
}

// Print and Export Functions
function printInvoice() {
    if (invoiceItems.length === 0) {
        alert("No items to print!");
        return;
    }
    const printWindow = window.open('', '_blank');
    const grandTotal = invoiceItems.reduce((sum, item) => sum + item.total, 0);
    printWindow.document.write(`
        <html>
        <head>
            <title>Invoice</title>
            <style>
                body { font-family: 'Roboto', sans-serif; padding: 20px; }
                h2 { color: #2c3e50; }
                table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
                th { background-color: #3498db; color: white; }
                .total { font-size: 1.2rem; font-weight: 500; margin-top: 20px; }
            </style>
        </head>
        <body>
            <h2>Invoice - ${new Date().toLocaleString()}</h2>
            <table>
                <thead>
                    <tr>
                        <th>#</th>
                        <th>Name</th>
                        <th>Batch</th>
                        <th>Price</th>
                        <th>Qty</th>
                        <th>Discount (%)</th>
                        <th>Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${invoiceItems.map((item, index) => `
                        <tr>
                            <td>${index + 1}</td>
                            <td>${item.name}</td>
                            <td>${item.batch}</td>
                            <td>${item.price.toFixed(2)}</td>
                            <td>${item.qty}</td>
                            <td>${item.discountPercent.toFixed(2)}</td>
                            <td>${item.total.toFixed(2)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            <div class="total">Grand Total: PKR ${grandTotal.toFixed(2)}</div>
        </body>
        </html>
    `);
    printWindow.document.close();
    printWindow.print();
    saveInvoiceToList(true);
}

function exportToPDF() {
    if (invoiceItems.length === 0) {
        alert("No items to export!");
        return;
    }
    const grandTotal = invoiceItems.reduce((sum, item) => sum + item.total, 0);
    const docDefinition = {
        content: [
            { text: `Invoice - Current`, style: 'header' },
            { text: `Date: ${new Date().toLocaleString()}`, style: 'subheader' },
            {
                table: {
                    headerRows: 1,
                    widths: ['auto', '*', 'auto', 'auto', 'auto', 'auto', 'auto'],
                    body: [
                        ['#', 'Name', 'Batch', 'Price', 'Qty', 'Discount (%)', 'Total'],
                        ...invoiceItems.map((item, index) => [
                            index + 1,
                            item.name,
                            item.batch,
                            item.price.toFixed(2),
                            item.qty,
                            item.discountPercent.toFixed(2),
                            item.total.toFixed(2)
                        ])
                    ]
                }
            },
            { text: `Grand Total: PKR ${grandTotal.toFixed(2)}`, style: 'total' }
        ],
        styles: {
            header: { fontSize: 18, bold: true, margin: [0, 0, 0, 10] },
            subheader: { fontSize: 12, margin: [0, 0, 0, 10] },
            total: { fontSize: 14, bold: true, margin: [0, 10, 0, 0] }
        }
    };
    pdfMake.createPdf(docDefinition).download(`invoice_current.pdf`);
}

function exportToExcel() {
    if (invoiceItems.length === 0) {
        alert("No items to export!");
        return;
    }
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "#,Name,Batch,Price,Qty,Discount (%),Total\n";
    invoiceItems.forEach((item, index) => {
        csvContent += `${index + 1},${item.name},${item.batch},${item.price.toFixed(2)},${item.qty},${item.discountPercent.toFixed(2)},${item.total.toFixed(2)}\n`;
    });
    const grandTotal = invoiceItems.reduce((sum, item) => sum + item.total, 0);
    csvContent += `,,,,,Grand Total,${grandTotal.toFixed(2)}\n`;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `invoice_current.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function saveInvoice() {
    if (invoiceItems.length === 0) {
        alert("Invoice is empty!");
        return;
    }
    saveInvoiceToList(false);
}

function saveInvoiceToList(includePDF = false) {
    const grandTotal = invoiceItems.reduce((sum, item) => sum + item.total, 0);
    const invoiceData = {
        invoiceNo: `INV-${Date.now()}`,
        date: new Date().toISOString(),
        amount: grandTotal,
        items: JSON.parse(JSON.stringify(invoiceItems))
    };
    
    savedInvoices.push(invoiceData);
    localStorage.setItem("savedInvoices", JSON.stringify(savedInvoices));
    
    if (includePDF) {
        const docDefinition = {
            content: [
                { text: `Invoice ${invoiceData.invoiceNo}`, style: 'header' },
                { text: `Date: ${new Date(invoiceData.date).toLocaleString()}`, style: 'subheader' },
                {
                    table: {
                        headerRows: 1,
                        widths: ['auto', '*', 'auto', 'auto', 'auto', 'auto', 'auto'],
                        body: [
                            ['#', 'Name', 'Batch', 'Price', 'Qty', 'Discount (%)', 'Total'],
                            ...invoiceItems.map((item, index) => [
                                index + 1,
                                item.name,
                                item.batch,
                                item.price.toFixed(2),
                                item.qty,
                                item.discountPercent.toFixed(2),
                                item.total.toFixed(2)
                            ])
                        ]
                    }
                },
                { text: `Grand Total: PKR ${grandTotal.toFixed(2)}`, style: 'total' }
            ],
            styles: {
                header: { fontSize: 18, bold: true, margin: [0, 0, 0, 10] },
                subheader: { fontSize: 12, margin: [0, 0, 0, 10] },
                total: { fontSize: 14, bold: true, margin: [0, 10, 0, 0] }
            }
        };
        pdfMake.createPdf(docDefinition).download(`invoice_${invoiceData.invoiceNo}.pdf`);
    }

    invoiceItems = [];
    updateInvoiceTable();
    displaySavedInvoices();
}

// Saved Invoices List Functions
function displaySavedInvoices() {
    let tbody = document.getElementById('savedInvoicesList').getElementsByTagName('tbody')[0];
    tbody.innerHTML = "";
    savedInvoices.forEach((invoice, index) => {
        tbody.innerHTML += `
            <tr>
                <td>${index + 1}</td>
                <td>${invoice.invoiceNo}</td>
                <td>${new Date(invoice.date).toLocaleString()}</td>
                <td>${invoice.amount.toFixed(2)}</td>
                <td><button class="btn btn-danger btn-sm" onclick="deleteSavedInvoice(${index})">Delete</button></td>
            </tr>`;
    });
}

function deleteSavedInvoice(index) {
    savedInvoices.splice(index, 1);
    localStorage.setItem("savedInvoices", JSON.stringify(savedInvoices));
    displaySavedInvoices();
}

function clearInputs(section) {
    document.querySelectorAll(`#${section} input`).forEach(input => input.value = "");
    if (section === 'invoiceSection') document.getElementById('invoiceItemList').innerHTML = "";
}

// Initialize
openTab('predefinedSection');
displayPredefinedItems();
displaySavedInvoices();