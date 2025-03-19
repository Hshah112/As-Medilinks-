let predefinedItems = JSON.parse(localStorage.getItem("predefinedItems")) || [];
let invoiceItems = [];
let savedInvoices = JSON.parse(localStorage.getItem("savedInvoices")) || [];
let editingInvoiceIndex = null;
let hot; // Handsontable instance

function openTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.style.display = "none");
    document.getElementById(tabName).style.display = "block";
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector(`button[onclick="openTab('${tabName}')"]`).classList.add('active');
    closeInvoiceDetail();
}

// Custom renderers for action buttons
function editRenderer(instance, td, row, col, prop, value, cellProperties) {
    td.innerHTML = `<button class="btn btn-primary btn-sm" onclick="editRow(${row})" title="Edit"><i class="fas fa-edit"></i></button>`;
    td.className = 'action-btn';
    return td;
}

function deleteRenderer(instance, td, row, col, prop, value, cellProperties) {
    td.innerHTML = `<button class="btn btn-danger btn-sm" onclick="deleteRow(${row})" title="Delete"><i class="fas fa-trash"></i></button>`;
    td.className = 'action-btn';
    return td;
}

function saveRenderer(instance, td, row, col, prop, value, cellProperties) {
    td.innerHTML = `<button class="btn btn-success btn-sm" onclick="saveRow(${row})" title="Save"><i class="fas fa-save"></i></button>`;
    td.className = 'action-btn';
    return td;
}

function editRow(row) {
    hot.selectCell(row, 0);
}

function deleteRow(row) {
    hot.alter('remove_row', row);
}

function saveRow(row) {
    const rowData = hot.getDataAtRow(row);
    const newItem = {
        name: rowData[0]?.trim() || '',
        batch: rowData[1]?.trim() || '',
        price: parseFloat(rowData[2]) || 0,
        stock: parseInt(rowData[3]) || 0,
        isEditing: false
    };

    if (!newItem.name || !newItem.batch || isNaN(newItem.price) || isNaN(newItem.stock)) {
        alert("Please fill all fields with valid data before saving.");
        return;
    }

    const duplicateIndex = predefinedItems.findIndex((item, index) => 
        index !== row && item.name === newItem.name && item.batch === newItem.batch
    );
    if (duplicateIndex !== -1) {
        alert("An item with this name and batch already exists.");
        return;
    }

    predefinedItems[row] = newItem;
    updatePredefinedItems();
}

// Initialize Handsontable for Predefined Items
function initializeSpreadsheet() {
    const container = document.getElementById('predefinedSpreadsheet');
    hot = new Handsontable(container, {
        data: predefinedItems.map(item => [item.name, item.batch, item.price, item.stock]),
        colHeaders: ['Name', 'Batch', 'Price', 'Stock', 'Edit', 'Delete', 'Save'],
        columns: [
            { type: 'text' },
            { type: 'text' },
            { type: 'numeric', numericFormat: { pattern: '0.00' } },
            { type: 'numeric' },
            { renderer: editRenderer, readOnly: true, width: 60 },
            { renderer: deleteRenderer, readOnly: true, width: 60 },
            { renderer: saveRenderer, readOnly: true, width: 60 }
        ],
        rowHeaders: true,
        minSpareRows: 1,
        stretchH: 'all',
        manualColumnResize: true,
        manualRowResize: true,
        contextMenu: true,
        licenseKey: 'non-commercial-and-evaluation',
        afterChange: (changes) => {
            // No auto-save; wait for Save button
        },
        afterRemoveRow: () => {
            updatePredefinedItems();
        }
    });
}

function updatePredefinedItems() {
    const data = hot.getData();
    predefinedItems = data
        .filter(row => row[0] && row[1] && !isNaN(row[2]) && !isNaN(row[3]))
        .map(row => ({
            name: row[0].trim(),
            batch: row[1].trim(),
            price: parseFloat(row[2]),
            stock: parseInt(row[3]),
            isEditing: false
        }));
    
    predefinedItems = predefinedItems.filter((item, index, self) =>
        index === self.findIndex(t => t.name === item.name && t.batch === item.batch)
    );
    
    localStorage.setItem("predefinedItems", JSON.stringify(predefinedItems));
    hot.loadData(predefinedItems.map(item => [item.name, item.batch, item.price, item.stock]));
}

function addNewRow() {
    hot.alter('insert_row', hot.countRows() - 1);
}

// Invoice Section Functions
function searchInvoiceItem() {
    const searchValue = document.getElementById('invoiceSearchItem').value.trim().toLowerCase();
    const list = document.getElementById('invoiceItemList');
    
    if (searchValue === "") {
        list.classList.remove('active');
        list.innerHTML = "";
        return;
    }

    const filteredItems = predefinedItems.filter(item => 
        item.name.toLowerCase().includes(searchValue) || item.batch.toLowerCase().includes(searchValue)
    );

    if (filteredItems.length > 0) {
        list.classList.add('active');
        list.innerHTML = filteredItems.map(item => `
            <li class="list-group-item" onclick="selectInvoiceItem('${item.name}', '${item.batch}', ${item.price})">
                ${item.name} - ${item.batch} - PKR ${item.price.toFixed(2)} (Stock: ${item.stock})
            </li>
        `).join('');
    } else {
        list.classList.remove('active');
        list.innerHTML = "";
    }
}

function selectInvoiceItem(name, batch, price) {
    document.getElementById('invoiceItemName').value = name;
    document.getElementById('invoiceBatchNo').value = batch;
    document.getElementById('invoicePrice').value = price.toFixed(2);
    document.getElementById('invoiceQty').value = 1;
    document.getElementById('invoiceDiscount').value = 0;
    document.getElementById('invoiceSearchItem').value = "";
    document.getElementById('invoiceItemList').classList.remove('active');
    calculateTotal();
}

function calculateTotal() {
    const price = parseFloat(document.getElementById('invoicePrice').value) || 0;
    const qty = parseInt(document.getElementById('invoiceQty').value) || 0;
    const discountPercent = parseFloat(document.getElementById('invoiceDiscount').value) || 0;
    const subtotal = price * qty;
    const discountAmount = (subtotal * discountPercent) / 100;
}

function addItemToInvoice() {
    let name = document.getElementById('invoiceItemName').value;
    let batch = document.getElementById('invoiceBatchNo').value;
    let price = parseFloat(document.getElementById('invoicePrice').value);
    let qty = parseInt(document.getElementById('invoiceQty').value);
    let discountPercent = parseFloat(document.getElementById('invoiceDiscount').value) || 0;
    
    const itemIndex = predefinedItems.findIndex(item => item.name === name && item.batch === batch);
    if (itemIndex === -1 || isNaN(price) || isNaN(qty) || qty <= 0 || qty > predefinedItems[itemIndex].stock) {
        alert(`Please enter valid values${qty > predefinedItems[itemIndex]?.stock ? ' (Quantity exceeds stock)' : ''}`);
        return;
    }
    
    const subtotal = price * qty;
    const discountAmount = (subtotal * discountPercent) / 100;
    const total = subtotal - discountAmount;
    
    predefinedItems[itemIndex].stock -= qty;
    localStorage.setItem("predefinedItems", JSON.stringify(predefinedItems));
    hot.loadData(predefinedItems.map(item => [item.name, item.batch, item.price, item.stock]));
    
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
    if (editingInvoiceIndex !== null) {
        updateSavedInvoiceTable(); // Update saved invoice table if editing a saved invoice
    } else {
        updateInvoiceTable(); // Update new invoice table otherwise
    }
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
    
    if (isNaN(updatedItem.price) || isNaN(updatedItem.qty) || updatedItem.qty <= 0 || 
        (stockDifference < 0 && Math.abs(stockDifference) > predefinedItems[itemIndex].stock)) {
        alert(`Please enter valid values${stockDifference < 0 ? ' (Quantity exceeds available stock)' : ''}`);
        return;
    }
    
    const subtotal = updatedItem.price * updatedItem.qty;
    const discountAmount = (subtotal * updatedItem.discountPercent) / 100;
    updatedItem.total = subtotal - discountAmount;
    
    predefinedItems[itemIndex].stock += stockDifference;
    localStorage.setItem("predefinedItems", JSON.stringify(predefinedItems));
    hot.loadData(predefinedItems.map(item => [item.name, item.batch, item.price, item.stock]));
    
    invoiceItems[index] = updatedItem;
    if (editingInvoiceIndex !== null) {
        updateSavedInvoiceTable();
    } else {
        updateInvoiceTable();
    }
}

function cancelEditInvoice(index) {
    invoiceItems[index].isEditing = false;
    if (editingInvoiceIndex !== null) {
        updateSavedInvoiceTable();
    } else {
        updateInvoiceTable();
    }
}

function deleteInvoiceItem(index) {
    const item = invoiceItems[index];
    const itemIndex = predefinedItems.findIndex(i => i.name === item.name && i.batch === item.batch);
    predefinedItems[itemIndex].stock += item.qty;
    localStorage.setItem("predefinedItems", JSON.stringify(predefinedItems));
    hot.loadData(predefinedItems.map(item => [item.name, item.batch, item.price, item.stock]));
    invoiceItems.splice(index, 1);
    if (editingInvoiceIndex !== null) {
        updateSavedInvoiceTable();
    } else {
        updateInvoiceTable();
    }
}

// Saved Invoices Functions
function viewSavedInvoice(index) {
    const invoice = savedInvoices[index];
    document.getElementById('invoiceDetailTitle').innerText = `Viewing Invoice ${invoice.invoiceNo}`;
    const table = document.getElementById('invoiceDetailTable');
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
            </tr>
        </thead>
        <tbody>
            ${invoice.items.map((item, i) => `
                <tr>
                    <td>${i + 1}</td>
                    <td>${item.name}</td>
                    <td>${item.batch}</td>
                    <td>${item.price.toFixed(2)}</td>
                    <td>${item.qty}</td>
                    <td>${item.discountPercent.toFixed(2)}</td>
                    <td>${item.total.toFixed(2)}</td>
                </tr>
            `).join('')}
        </tbody>`;
    document.getElementById('invoiceDetailTotal').innerText = `PKR ${invoice.amount.toFixed(2)}`;
    document.getElementById('saveEditedInvoiceBtn').style.display = 'none';
    document.getElementById('invoiceDetailSection').style.display = 'block';
}

function editSavedInvoice(index) {
    editingInvoiceIndex = index;
    const invoice = savedInvoices[index];
    invoiceItems = invoice.items.map(item => ({ ...item, isEditing: false })); // Deep copy with isEditing flag
    document.getElementById('invoiceDetailTitle').innerText = `Editing Invoice ${invoice.invoiceNo}`;
    updateSavedInvoiceTable();
    document.getElementById('saveEditedInvoiceBtn').style.display = 'inline-block';
    document.getElementById('invoiceDetailSection').style.display = 'block';
}

function updateSavedInvoiceTable() {
    const table = document.getElementById('invoiceDetailTable');
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
    document.getElementById('invoiceDetailTotal').innerText = `PKR ${grandTotal.toFixed(2)}`;
}

function saveEditedInvoice() {
    if (editingInvoiceIndex === null) return;
    const grandTotal = invoiceItems.reduce((sum, item) => sum + item.total, 0);
    savedInvoices[editingInvoiceIndex] = {
        ...savedInvoices[editingInvoiceIndex],
        amount: grandTotal,
        items: invoiceItems.map(item => ({ ...item, isEditing: false }))
    };
    localStorage.setItem("savedInvoices", JSON.stringify(savedInvoices));
    invoiceItems = [];
    editingInvoiceIndex = null;
    displaySavedInvoices();
    closeInvoiceDetail();
}

function closeInvoiceDetail() {
    document.getElementById('invoiceDetailSection').style.display = 'none';
    invoiceItems = [];
    editingInvoiceIndex = null;
}

function printSavedInvoice(index) {
    const invoice = savedInvoices[index];
    const printWindow = window.open('', '_blank');
    const grandTotal = invoice.amount;
    const invoiceHtml = `
        <html>
        <head>
            <title>Invoice ${invoice.invoiceNo}</title>
            <style>
                body { font-family: 'Roboto', sans-serif; padding: 20px; }
                h1 { font-size: 18px; color: #2c3e50; text-align: center; font-weight: bold; text-transform: uppercase; margin-bottom: 20px; letter-spacing: 1px; }
                h2 { color: #2c3e50; font-size: 16px; }
                table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
                th { background-color: #3498db; color: white; }
                .total { font-size: 1.2rem; font-weight: 500; margin-top: 20px; text-align: right; }
            </style>
        </head>
        <body>
            <h1>AS MEDILINK</h1>
            <h2>Invoice - ${new Date(invoice.date).toLocaleString()}</h2>
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
                    ${invoice.items.map((item, i) => `
                        <tr>
                            <td>${i + 1}</td>
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
    `;
    printWindow.document.write(invoiceHtml);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    
    setTimeout(() => {
        const viewWindow = window.open('', '_blank');
        viewWindow.document.write(invoiceHtml);
        viewWindow.document.close();
    }, 500);
}

function exportSavedInvoiceToPDF(index) {
    const invoice = savedInvoices[index];
    const grandTotal = invoice.amount;
    const docDefinition = {
        content: [
            { text: 'AS MEDILINK', style: 'mainHeader' },
            { text: `Invoice ${invoice.invoiceNo}`, style: 'header' },
            { text: `Date: ${new Date(invoice.date).toLocaleString()}`, style: 'subheader' },
            {
                table: {
                    headerRows: 1,
                    widths: ['auto', '*', 'auto', 'auto', 'auto', 'auto', 'auto'],
                    body: [
                        ['#', 'Name', 'Batch', 'Price', 'Qty', 'Discount (%)', 'Total'],
                        ...invoice.items.map((item, i) => [
                            i + 1,
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
            mainHeader: { fontSize: 18, bold: true, alignment: 'center', textTransform: 'uppercase', color: '#2c3e50', margin: [0, 0, 0, 20], letterSpacing: 1 },
            header: { fontSize: 16, bold: true, margin: [0, 0, 0, 10] },
            subheader: { fontSize: 12, margin: [0, 0, 0, 10] },
            total: { fontSize: 14, bold: true, margin: [0, 10, 0, 0], alignment: 'right' }
        }
    };

    const pdfDoc = pdfMake.createPdf(docDefinition);
    pdfDoc.getBlob((blob) => {
        const url = URL.createObjectURL(blob);
        const pdfWindow = window.open(url, '_blank');
        pdfWindow.focus();

        const reader = new FileReader();
        reader.onloadend = () => {
            localStorage.setItem(`invoice_${invoice.invoiceNo}.pdf`, reader.result);
        };
        reader.readAsDataURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.download = `invoice_${invoice.invoiceNo}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });
}

function saveInvoice() {
    if (invoiceItems.length === 0) {
        alert("Invoice is empty!");
        return;
    }
    const grandTotal = invoiceItems.reduce((sum, item) => sum + item.total, 0);
    const invoiceData = {
        invoiceNo: `INV-${Date.now()}`,
        date: new Date().toISOString(),
        amount: grandTotal,
        items: JSON.parse(JSON.stringify(invoiceItems))
    };
    
    savedInvoices.push(invoiceData);
    localStorage.setItem("savedInvoices", JSON.stringify(savedInvoices));
    
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
                <td>
                    <button class="btn btn-info btn-sm me-1" onclick="viewSavedInvoice(${index})" title="View">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-warning btn-sm me-1" onclick="editSavedInvoice(${index})" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-primary btn-sm me-1" onclick="printSavedInvoice(${index})" title="Print">
                        <i class="fas fa-print"></i>
                    </button>
                    <button class="btn btn-secondary btn-sm me-1" onclick="exportSavedInvoiceToPDF(${index})" title="PDF">
                        <i class="fas fa-file-pdf"></i>
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="deleteSavedInvoice(${index})" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>`;
    });
}

function deleteSavedInvoice(index) {
    savedInvoices.splice(index, 1);
    localStorage.setItem("savedInvoices", JSON.stringify(savedInvoices));
    displaySavedInvoices();
    closeInvoiceDetail();
}

function clearInputs(section) {
    document.querySelectorAll(`#${section} input`).forEach(input => input.value = "");
    if (section === 'invoiceSection') document.getElementById('invoiceItemList').classList.remove('active');
}

// Initialize
openTab('predefinedSection');
initializeSpreadsheet();
displaySavedInvoices();
