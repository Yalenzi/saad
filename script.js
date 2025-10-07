// Global Variables
let contracts = JSON.parse(localStorage.getItem('contracts')) || [];
let templates = JSON.parse(localStorage.getItem('templates')) || [];
let imageTemplates = JSON.parse(localStorage.getItem('imageTemplates')) || [];
let clients = JSON.parse(localStorage.getItem('clients')) || [];
let agreements = JSON.parse(localStorage.getItem('agreements')) || [];
let currentContract = null;
let currentTemplate = null;
let currentAgreement = null;
let editingContractId = null;
let editingItemId = null;
let editingTemplateId = null;
let editingImageTemplateId = null;
let editingClientId = null;
let editingAgreementId = null;

// Canvas variables for image editor
let canvas, ctx, currentImage, textElements = [];
let selectedTextElement = null;
let isDragging = false;
let dragOffset = { x: 0, y: 0 };

// Signature variables
let signatureCanvas, signatureCtx;
let isSignatureDrawing = false;
let signatureType = ''; // 'company' or 'client'
let currentSigningAgreementId = null;

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    loadContracts();
    loadTemplates();
    loadImageTemplates();
    loadClients();
    loadAgreements();
    setupImageEditor();
    setupSignatureCanvas();
    checkAgreementFromURL();
});

// Initialize application
function initializeApp() {
    // Show contracts page by default
    showPage('contracts');
    
    // Add sample data if none exists
    if (contracts.length === 0) {
        addSampleData();
    }
}

// Setup event listeners
function setupEventListeners() {
    // Mobile menu toggle
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');
    
    if (hamburger) {
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('active');
            navMenu.classList.toggle('active');
        });
    }

    // Contract form submission
    const contractForm = document.getElementById('contract-form');
    if (contractForm) {
        contractForm.addEventListener('submit', handleContractSubmit);
    }

    // Item form submission
    const itemForm = document.getElementById('item-form');
    if (itemForm) {
        itemForm.addEventListener('submit', handleItemSubmit);
    }

    // Template form submission
    const templateForm = document.getElementById('template-form');
    if (templateForm) {
        templateForm.addEventListener('submit', handleTemplateSubmit);
    }

    // Image template form submission
    const imageTemplateForm = document.getElementById('image-template-form');
    if (imageTemplateForm) {
        imageTemplateForm.addEventListener('submit', handleImageTemplateSubmit);
    }

    // Client form submission
    const clientForm = document.getElementById('client-form');
    if (clientForm) {
        clientForm.addEventListener('submit', handleClientSubmit);
    }

    // Agreement form submission
    const agreementForm = document.getElementById('agreement-form');
    if (agreementForm) {
        agreementForm.addEventListener('submit', handleAgreementSubmit);
    }

    // Close modals when clicking outside
    window.addEventListener('click', function(event) {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            if (event.target === modal) {
                modal.style.display = 'none';
            }
        });
    });

    // Font size slider
    const fontSizeSlider = document.getElementById('font-size');
    const fontSizeValue = document.getElementById('font-size-value');
    if (fontSizeSlider && fontSizeValue) {
        fontSizeSlider.addEventListener('input', function() {
            fontSizeValue.textContent = this.value + 'px';
        });
    }
}

// Page navigation
function showPage(pageId) {
    // Hide all pages
    const pages = document.querySelectorAll('.page');
    pages.forEach(page => page.classList.remove('active'));
    
    // Show selected page
    const targetPage = document.getElementById(pageId + '-page');
    if (targetPage) {
        targetPage.classList.add('active');
    }
    
    // Update navigation
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => link.classList.remove('active'));
    
    // Close mobile menu
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');
    if (hamburger && navMenu) {
        hamburger.classList.remove('active');
        navMenu.classList.remove('active');
    }
}

// Contract Management Functions
function loadContracts() {
    const tbody = document.getElementById('contracts-tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    contracts.forEach(contract => {
        const row = createContractRow(contract);
        tbody.appendChild(row);
    });
    
    updateStatistics();
}

function createContractRow(contract) {
    const row = document.createElement('tr');
    
    const total = calculateContractTotal(contract.id);
    const statusClass = getStatusClass(contract.status);
    
    row.innerHTML = `
        <td>${contract.number}</td>
        <td>${contract.clientName}</td>
        <td>${contract.type}</td>
        <td>${formatDate(contract.startDate)}</td>
        <td>${formatDate(contract.endDate)}</td>
        <td>${formatCurrency(total)}</td>
        <td><span class="status-badge ${statusClass}">${contract.status}</span></td>
        <td>
            <div class="btn-group">
                <button class="btn btn-info btn-sm" onclick="viewContract('${contract.id}')">
                    <i class="fas fa-eye"></i> عرض
                </button>
                <button class="btn btn-warning btn-sm" onclick="editContract('${contract.id}')">
                    <i class="fas fa-edit"></i> تعديل
                </button>
                <button class="btn btn-success btn-sm" onclick="printContract('${contract.id}')">
                    <i class="fas fa-print"></i> طباعة
                </button>
                <button class="btn btn-danger btn-sm" onclick="deleteContract('${contract.id}')">
                    <i class="fas fa-trash"></i> حذف
                </button>
            </div>
        </td>
    `;
    
    return row;
}

function showAddContractForm() {
    editingContractId = null;
    document.getElementById('contract-modal-title').textContent = 'إضافة عقد جديد';
    document.getElementById('contract-form').reset();
    loadTemplateOptions();
    
    // Generate automatic contract number
    const contractNumber = generateContractNumber();
    document.getElementById('contract-number').value = contractNumber;
    
    showModal('contract-modal');
}

function editContract(contractId) {
    const contract = contracts.find(c => c.id === contractId);
    if (!contract) return;
    
    editingContractId = contractId;
    document.getElementById('contract-modal-title').textContent = 'تعديل العقد';
    
    // Fill form with contract data
    document.getElementById('contract-number').value = contract.number;
    document.getElementById('client-name').value = contract.clientName;
    document.getElementById('contract-type').value = contract.type;
    document.getElementById('contract-status').value = contract.status;
    document.getElementById('start-date').value = contract.startDate;
    document.getElementById('end-date').value = contract.endDate;
    document.getElementById('phone').value = contract.phone;
    document.getElementById('email').value = contract.email || '';
    document.getElementById('address').value = contract.address;
    document.getElementById('description').value = contract.description || '';
    
    loadTemplateOptions();
    showModal('contract-modal');
}


function deleteContract(contractId) {
    if (confirm('هل أنت متأكد من حذف هذا العقد؟')) {
        contracts = contracts.filter(c => c.id !== contractId);
        saveContracts();
        loadContracts();
        showSuccessMessage('تم حذف العقد بنجاح');
    }
}

function viewContract(contractId) {
    currentContract = contracts.find(c => c.id === contractId);
    if (!currentContract) return;
    
    displayContractDetails();
    showPage('contract-details');
}

function displayContractDetails() {
    if (!currentContract) return;
    
    document.getElementById('contract-details-title').textContent = `تفاصيل العقد - ${currentContract.number}`;
    
    const contractInfo = document.getElementById('contract-info');
    contractInfo.innerHTML = `
        <div class="info-grid">
            <div class="info-item">
                <span class="info-label">رقم العقد:</span>
                <span class="info-value">${currentContract.number}</span>
            </div>
            <div class="info-item">
                <span class="info-label">اسم العميل:</span>
                <span class="info-value">${currentContract.clientName}</span>
            </div>
            <div class="info-item">
                <span class="info-label">نوع العقد:</span>
                <span class="info-value">${currentContract.type}</span>
            </div>
            <div class="info-item">
                <span class="info-label">الحالة:</span>
                <span class="info-value">
                    <span class="status-badge ${getStatusClass(currentContract.status)}">${currentContract.status}</span>
                </span>
            </div>
            <div class="info-item">
                <span class="info-label">تاريخ البداية:</span>
                <span class="info-value">${formatDate(currentContract.startDate)}</span>
            </div>
            <div class="info-item">
                <span class="info-label">تاريخ النهاية:</span>
                <span class="info-value">${formatDate(currentContract.endDate)}</span>
            </div>
            <div class="info-item">
                <span class="info-label">رقم الهاتف:</span>
                <span class="info-value">${currentContract.phone}</span>
            </div>
            <div class="info-item">
                <span class="info-label">البريد الإلكتروني:</span>
                <span class="info-value">${currentContract.email || 'غير محدد'}</span>
            </div>
            <div class="info-item" style="grid-column: 1 / -1;">
                <span class="info-label">العنوان:</span>
                <span class="info-value">${currentContract.address}</span>
            </div>
            ${currentContract.description ? `
            <div class="info-item" style="grid-column: 1 / -1;">
                <span class="info-label">وصف العقد:</span>
                <span class="info-value">${currentContract.description}</span>
            </div>
            ` : ''}
        </div>
    `;
    
    loadContractItems();
}

function loadContractItems() {
    if (!currentContract) return;
    
    const tbody = document.getElementById('items-tbody');
    tbody.innerHTML = '';
    
    if (!currentContract.items) {
        currentContract.items = [];
    }
    
    currentContract.items.forEach(item => {
        const row = createItemRow(item);
        tbody.appendChild(row);
    });
    
    updateContractTotal();
}

function createItemRow(item) {
    const row = document.createElement('tr');
    const total = item.quantity * item.price;
    
    row.innerHTML = `
        <td>${item.description}</td>
        <td>${item.quantity}</td>
        <td>${item.unit}</td>
        <td>${formatCurrency(item.price)}</td>
        <td>${formatCurrency(total)}</td>
        <td>${item.notes || ''}</td>
        <td>
            <button class="btn btn-warning" onclick="editItem('${item.id}')">
                <i class="fas fa-edit"></i> تعديل
            </button>
            <button class="btn btn-danger" onclick="deleteItem('${item.id}')">
                <i class="fas fa-trash"></i> حذف
            </button>
        </td>
    `;
    
    return row;
}

// Utility Functions
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-SA');
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('ar-SA', {
        style: 'currency',
        currency: 'SAR'
    }).format(amount);
}

function getStatusClass(status) {
    const statusMap = {
        'نشط': 'status-active',
        'مكتمل': 'status-completed',
        'معلق': 'status-pending',
        'ملغي': 'status-cancelled'
    };
    return statusMap[status] || 'status-active';
}

function calculateContractTotal(contractId) {
    const contract = contracts.find(c => c.id === contractId);
    if (!contract || !contract.items) return 0;
    
    return contract.items.reduce((total, item) => {
        return total + (item.quantity * item.price);
    }, 0);
}

function updateContractTotal() {
    if (!currentContract) return;
    
    const total = calculateContractTotal(currentContract.id);
    document.getElementById('contract-total').textContent = formatCurrency(total);
}

function saveContracts() {
    localStorage.setItem('contracts', JSON.stringify(contracts));
}

function saveTemplates() {
    localStorage.setItem('templates', JSON.stringify(templates));
}

function showModal(modalId) {
    document.getElementById(modalId).style.display = 'block';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

function showSuccessMessage(message) {
    // Create and show a temporary success message
    const messageDiv = document.createElement('div');
    messageDiv.className = 'success-message';
    messageDiv.textContent = message;
    messageDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #28a745;
        color: white;
        padding: 1rem 2rem;
        border-radius: 8px;
        z-index: 3000;
        box-shadow: 0 4px 20px rgba(0,0,0,0.3);
    `;
    
    document.body.appendChild(messageDiv);
    
    setTimeout(() => {
        messageDiv.remove();
    }, 3000);
}

// Contract Items Management
function showAddItemForm() {
    if (!currentContract) return;

    editingItemId = null;
    document.getElementById('item-modal-title').textContent = 'إضافة بند جديد';
    document.getElementById('item-form').reset();
    showModal('item-modal');
}

function editItem(itemId) {
    if (!currentContract) return;

    const item = currentContract.items.find(i => i.id === itemId);
    if (!item) return;

    editingItemId = itemId;
    document.getElementById('item-modal-title').textContent = 'تعديل البند';

    document.getElementById('item-description').value = item.description;
    document.getElementById('item-quantity').value = item.quantity;
    document.getElementById('item-unit').value = item.unit;
    document.getElementById('item-price').value = item.price;
    document.getElementById('item-notes').value = item.notes || '';

    showModal('item-modal');
}

function handleItemSubmit(event) {
    event.preventDefault();

    if (!currentContract) return;

    const formData = {
        description: document.getElementById('item-description').value,
        quantity: parseFloat(document.getElementById('item-quantity').value),
        unit: document.getElementById('item-unit').value,
        price: parseFloat(document.getElementById('item-price').value),
        notes: document.getElementById('item-notes').value
    };

    if (editingItemId) {
        // Update existing item
        const itemIndex = currentContract.items.findIndex(i => i.id === editingItemId);
        if (itemIndex !== -1) {
            currentContract.items[itemIndex] = { ...currentContract.items[itemIndex], ...formData };
        }
    } else {
        // Add new item
        const newItem = {
            id: generateId(),
            ...formData
        };
        currentContract.items.push(newItem);
    }

    // Update contract in contracts array
    const contractIndex = contracts.findIndex(c => c.id === currentContract.id);
    if (contractIndex !== -1) {
        contracts[contractIndex] = currentContract;
    }

    saveContracts();
    loadContractItems();
    loadContracts(); // Refresh main contracts table
    closeModal('item-modal');
    showSuccessMessage(editingItemId ? 'تم تحديث البند بنجاح' : 'تم إضافة البند بنجاح');
}

function deleteItem(itemId) {
    if (!currentContract) return;

    if (confirm('هل أنت متأكد من حذف هذا البند؟')) {
        currentContract.items = currentContract.items.filter(i => i.id !== itemId);

        // Update contract in contracts array
        const contractIndex = contracts.findIndex(c => c.id === currentContract.id);
        if (contractIndex !== -1) {
            contracts[contractIndex] = currentContract;
        }

        saveContracts();
        loadContractItems();
        loadContracts(); // Refresh main contracts table
        showSuccessMessage('تم حذف البند بنجاح');
    }
}

// Templates Management
function loadTemplates() {
    const templatesGrid = document.getElementById('templates-grid');
    if (!templatesGrid) return;

    templatesGrid.innerHTML = '';

    if (templates.length === 0) {
        templatesGrid.innerHTML = `
            <div class="card" style="grid-column: 1 / -1; text-align: center; padding: 3rem;">
                <i class="fas fa-file-alt" style="font-size: 3rem; color: #ccc; margin-bottom: 1rem;"></i>
                <p style="color: #666;">لا توجد نماذج حالياً. قم بإضافة نموذج جديد للبدء.</p>
            </div>
        `;
        return;
    }

    templates.forEach(template => {
        const templateCard = createTemplateCard(template);
        templatesGrid.appendChild(templateCard);
    });
}

function createTemplateCard(template) {
    const card = document.createElement('div');
    card.className = 'template-card';

    const itemsPreview = template.items ? template.items.slice(0, 3).map(item =>
        `<li>${item.description} (${item.quantity} ${item.unit})</li>`
    ).join('') : '';

    const moreItems = template.items && template.items.length > 3 ?
        `<li style="color: #999;">... و ${template.items.length - 3} بنود أخرى</li>` : '';

    card.innerHTML = `
        <div class="template-header">
            <h3 class="template-title">${template.name}</h3>
            <span class="template-category">${template.category}</span>
        </div>
        <p class="template-description">${template.description}</p>
        ${template.items && template.items.length > 0 ? `
        <div class="template-items">
            <h4>البنود المتضمنة:</h4>
            <ul>
                ${itemsPreview}
                ${moreItems}
            </ul>
        </div>
        ` : ''}
        <div class="template-actions">
            <button class="btn btn-info" onclick="useTemplate('${template.id}')">
                <i class="fas fa-play"></i> استخدام
            </button>
            <button class="btn btn-warning" onclick="editTemplate('${template.id}')">
                <i class="fas fa-edit"></i> تعديل
            </button>
            <button class="btn btn-danger" onclick="deleteTemplate('${template.id}')">
                <i class="fas fa-trash"></i> حذف
            </button>
        </div>
    `;

    return card;
}

function addSampleData() {
    const sampleContracts = [
        {
            id: generateId(),
            number: 'C-2024-001',
            clientName: 'شركة البناء المتطور',
            type: 'بناء',
            status: 'نشط',
            startDate: '2024-01-15',
            endDate: '2024-06-15',
            phone: '0501234567',
            email: 'info@building.com',
            address: 'الرياض، حي النرجس',
            description: 'بناء مجمع سكني متكامل',
            items: [
                {
                    id: generateId(),
                    description: 'أعمال الحفر والأساسات',
                    quantity: 1,
                    unit: 'مقطوعية',
                    price: 150000,
                    notes: 'يشمل الحفر حتى عمق 3 متر'
                },
                {
                    id: generateId(),
                    description: 'أعمال الخرسانة المسلحة',
                    quantity: 500,
                    unit: 'متر مكعب',
                    price: 800,
                    notes: 'خرسانة درجة 350'
                }
            ],
            createdAt: new Date().toISOString()
        }
    ];

    const sampleTemplates = [
        {
            id: generateId(),
            name: 'نموذج عقد البناء الأساسي',
            description: 'نموذج شامل لعقود البناء السكني',
            category: 'بناء',
            items: [
                {
                    id: generateId(),
                    description: 'أعمال الحفر والأساسات',
                    quantity: 1,
                    unit: 'مقطوعية',
                    price: 100000,
                    notes: 'حسب المخططات المعتمدة'
                },
                {
                    id: generateId(),
                    description: 'أعمال الخرسانة المسلحة',
                    quantity: 300,
                    unit: 'متر مكعب',
                    price: 800,
                    notes: 'خرسانة درجة 350'
                },
                {
                    id: generateId(),
                    description: 'أعمال البناء والطوب',
                    quantity: 1000,
                    unit: 'متر مربع',
                    price: 120,
                    notes: 'طوب أحمر عادي'
                }
            ],
            createdAt: new Date().toISOString()
        }
    ];

    contracts = sampleContracts;
    templates = sampleTemplates;
    saveContracts();
    saveTemplates();
}

// Template Management Functions
function showAddTemplateForm() {
    editingTemplateId = null;
    document.getElementById('template-modal-title').textContent = 'إضافة نموذج جديد';
    document.getElementById('template-form').reset();
    showModal('template-modal');
}

function editTemplate(templateId) {
    const template = templates.find(t => t.id === templateId);
    if (!template) return;
    
    editingTemplateId = templateId;
    document.getElementById('template-modal-title').textContent = 'تعديل النموذج';
    
    document.getElementById('template-name').value = template.name;
    document.getElementById('template-category').value = template.category;
    document.getElementById('template-description').value = template.description;
    
    showModal('template-modal');
}

function handleTemplateSubmit(event) {
    event.preventDefault();
    
    const formData = {
        name: document.getElementById('template-name').value,
        category: document.getElementById('template-category').value,
        description: document.getElementById('template-description').value
    };
    
    if (editingTemplateId) {
        // Update existing template
        const templateIndex = templates.findIndex(t => t.id === editingTemplateId);
        if (templateIndex !== -1) {
            templates[templateIndex] = { ...templates[templateIndex], ...formData };
        }
    } else {
        // Add new template
        const newTemplate = {
            id: generateId(),
            ...formData,
            items: [],
            createdAt: new Date().toISOString()
        };
        templates.push(newTemplate);
    }
    
    saveTemplates();
    loadTemplates();
    loadTemplateOptions();
    closeModal('template-modal');
    showSuccessMessage(editingTemplateId ? 'تم تحديث النموذج بنجاح' : 'تم إضافة النموذج بنجاح');
}

function deleteTemplate(templateId) {
    if (confirm('هل أنت متأكد من حذف هذا النموذج؟')) {
        templates = templates.filter(t => t.id !== templateId);
        saveTemplates();
        loadTemplates();
        loadTemplateOptions();
        showSuccessMessage('تم حذف النموذج بنجاح');
    }
}

function useTemplate(templateId) {
    const template = templates.find(t => t.id === templateId);
    if (!template) return;
    
    // Create new contract based on template
    showAddContractForm();
    
    // Fill contract type and description from template
    document.getElementById('contract-type').value = template.category;
    document.getElementById('description').value = template.description;
    
    // Store template ID for later use
    currentTemplate = template;
}

function loadTemplateOptions() {
    const templateSelect = document.getElementById('template-select');
    if (!templateSelect) return;
    
    templateSelect.innerHTML = '<option value="">اختر نموذج (اختياري)</option>';
    
    templates.forEach(template => {
        const option = document.createElement('option');
        option.value = template.id;
        option.textContent = template.name;
        templateSelect.appendChild(option);
    });
}

function applyTemplate() {
    const templateSelect = document.getElementById('template-select');
    const templateId = templateSelect.value;
    
    if (!templateId) {
        alert('يرجى اختيار نموذج أولاً');
        return;
    }
    
    const template = templates.find(t => t.id === templateId);
    if (!template) return;
    
    // Fill form with template data
    document.getElementById('contract-type').value = template.category;
    document.getElementById('description').value = template.description;
    
    currentTemplate = template;
    showSuccessMessage('تم تطبيق النموذج بنجاح');
}

// Image Editor Functions
function setupImageEditor() {
    const uploadArea = document.getElementById('upload-area');
    const imageInput = document.getElementById('image-input');
    const editorWorkspace = document.getElementById('editor-workspace');
    
    if (!uploadArea || !imageInput) return;
    
    // Click to upload
    uploadArea.addEventListener('click', () => {
        imageInput.click();
    });
    
    // Drag and drop
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.style.backgroundColor = '#f0f0ff';
    });
    
    uploadArea.addEventListener('dragleave', () => {
        uploadArea.style.backgroundColor = '';
    });
    
    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.style.backgroundColor = '';
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleImageUpload(files[0]);
        }
    });
    
    // File input change
    imageInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleImageUpload(e.target.files[0]);
        }
    });
    
    // Initialize canvas
    canvas = document.getElementById('image-canvas');
    if (canvas) {
        ctx = canvas.getContext('2d');
        
        // Canvas events for text positioning and dragging
        canvas.addEventListener('mousedown', handleCanvasMouseDown);
        canvas.addEventListener('mousemove', handleCanvasMouseMove);
        canvas.addEventListener('mouseup', handleCanvasMouseUp);
        canvas.addEventListener('click', handleCanvasClick);
    }
}

function handleImageUpload(file) {
    if (!file.type.startsWith('image/')) {
        alert('يرجى اختيار ملف صورة صحيح');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
            currentImage = img;
            setupCanvas();
            document.getElementById('upload-area').style.display = 'none';
            document.getElementById('editor-workspace').style.display = 'grid';
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

function setupCanvas() {
    if (!canvas || !currentImage) return;
    
    // Set canvas size to match image
    const maxWidth = 800;
    const maxHeight = 600;
    
    let { width, height } = currentImage;
    
    // Scale down if too large
    if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width *= ratio;
        height *= ratio;
    }
    
    canvas.width = width;
    canvas.height = height;
    
    // Clear canvas and draw image
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(currentImage, 0, 0, width, height);
    
    // Reset text elements
    textElements = [];
    selectedTextElement = null;
    updateTextElementsList();
}

function addTextToImage() {
    const textInput = document.getElementById('text-input');
    const text = textInput.value.trim();
    
    if (!text) {
        alert('يرجى إدخال النص أولاً');
        return;
    }
    
    // Add text at center of canvas
    const x = canvas.width / 2;
    const y = canvas.height / 2;
    
    addTextAtPosition(x, y);
    textInput.value = '';
}

function addTextAtPosition(x, y) {
    const text = document.getElementById('text-input').value.trim();
    const fontSize = document.getElementById('font-size').value;
    const color = document.getElementById('text-color').value;
    const fontFamily = document.getElementById('font-family').value;
    
    if (!text) return;
    
    const textElement = {
        id: generateId(),
        text: text,
        x: x,
        y: y,
        fontSize: fontSize,
        color: color,
        fontFamily: fontFamily
    };
    
    textElements.push(textElement);
    redrawCanvas();
    updateTextElementsList();
    
    showSuccessMessage('تم إضافة النص بنجاح');
}

// Canvas Event Handlers
function handleCanvasMouseDown(e) {
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);
    
    // Check if clicking on existing text
    const clickedElement = getTextElementAt(x, y);
    if (clickedElement) {
        selectedTextElement = clickedElement;
        isDragging = true;
        dragOffset.x = x - clickedElement.x;
        dragOffset.y = y - clickedElement.y;
        updateTextElementsList();
        e.preventDefault();
    }
}

function handleCanvasMouseMove(e) {
    if (isDragging && selectedTextElement) {
        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) * (canvas.width / rect.width);
        const y = (e.clientY - rect.top) * (canvas.height / rect.height);
        
        selectedTextElement.x = x - dragOffset.x;
        selectedTextElement.y = y - dragOffset.y;
        
        redrawCanvas();
        e.preventDefault();
    }
}

function handleCanvasMouseUp(e) {
    if (isDragging) {
        isDragging = false;
        showSuccessMessage('تم تحريك النص بنجاح');
    }
}

function handleCanvasClick(e) {
    if (!isDragging && document.getElementById('text-input').value.trim()) {
        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) * (canvas.width / rect.width);
        const y = (e.clientY - rect.top) * (canvas.height / rect.height);
        
        addTextAtPosition(x, y);
        document.getElementById('text-input').value = '';
    }
}

function getTextElementAt(x, y) {
    for (let i = textElements.length - 1; i >= 0; i--) {
        const element = textElements[i];
        ctx.font = `${element.fontSize}px ${element.fontFamily}`;
        const textMetrics = ctx.measureText(element.text);
        const textWidth = textMetrics.width;
        const textHeight = parseInt(element.fontSize);
        
        if (x >= element.x - textWidth/2 && x <= element.x + textWidth/2 &&
            y >= element.y - textHeight/2 && y <= element.y + textHeight/2) {
            return element;
        }
    }
    return null;
}

function redrawCanvas() {
    if (!canvas || !currentImage) return;
    
    // Clear and redraw image
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(currentImage, 0, 0, canvas.width, canvas.height);
    
    // Draw all text elements
    textElements.forEach(element => {
        ctx.font = `${element.fontSize}px ${element.fontFamily || 'Cairo'}, Arial, sans-serif`;
        ctx.fillStyle = element.color;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Add text shadow for better visibility
        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.shadowBlur = 2;
        ctx.shadowOffsetX = 1;
        ctx.shadowOffsetY = 1;
        
        ctx.fillText(element.text, element.x, element.y);
        
        // Highlight selected element
        if (selectedTextElement && selectedTextElement.id === element.id) {
            ctx.strokeStyle = '#667eea';
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            const textMetrics = ctx.measureText(element.text);
            const textWidth = textMetrics.width;
            const textHeight = parseInt(element.fontSize);
            ctx.strokeRect(element.x - textWidth/2 - 5, element.y - textHeight/2 - 5, 
                          textWidth + 10, textHeight + 10);
            ctx.setLineDash([]);
        }
        
        // Reset shadow
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
    });
}

// Text Elements List Management
function updateTextElementsList() {
    const listContainer = document.getElementById('text-elements-list');
    if (!listContainer) return;
    
    listContainer.innerHTML = '';
    
    if (textElements.length === 0) {
        listContainer.innerHTML = '<p style="text-align: center; color: #999; margin: 1rem;">لا توجد نصوص مضافة</p>';
        return;
    }
    
    textElements.forEach(element => {
        const item = document.createElement('div');
        item.className = 'text-element-item';
        if (selectedTextElement && selectedTextElement.id === element.id) {
            item.classList.add('selected');
        }
        
        item.innerHTML = `
            <div class="text-element-preview" title="${element.text}">
                ${element.text}
            </div>
            <div class="text-element-actions">
                <button class="btn-edit-text" onclick="editTextElement('${element.id}')">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-delete-text" onclick="deleteTextElement('${element.id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        
        item.addEventListener('click', () => {
            selectedTextElement = element;
            updateTextElementsList();
            redrawCanvas();
        });
        
        listContainer.appendChild(item);
    });
}

function editTextElement(elementId) {
    const element = textElements.find(e => e.id === elementId);
    if (!element) return;
    
    document.getElementById('text-input').value = element.text;
    document.getElementById('font-size').value = element.fontSize;
    document.getElementById('font-size-value').textContent = element.fontSize + 'px';
    document.getElementById('text-color').value = element.color;
    document.getElementById('font-family').value = element.fontFamily || 'Cairo';
    
    selectedTextElement = element;
    updateTextElementsList();
    redrawCanvas();
}

function deleteTextElement(elementId) {
    if (confirm('هل أنت متأكد من حذف هذا النص؟')) {
        textElements = textElements.filter(e => e.id !== elementId);
        if (selectedTextElement && selectedTextElement.id === elementId) {
            selectedTextElement = null;
        }
        updateTextElementsList();
        redrawCanvas();
        showSuccessMessage('تم حذف النص بنجاح');
    }
}

function clearCanvas() {
    if (confirm('هل أنت متأكد من مسح جميع النصوص؟')) {
        textElements = [];
        selectedTextElement = null;
        updateTextElementsList();
        redrawCanvas();
        showSuccessMessage('تم مسح جميع النصوص');
    }
}

function saveImage() {
    if (!canvas) {
        alert('لا توجد صورة للحفظ');
        return;
    }
    
    // Create download link
    const link = document.createElement('a');
    link.download = `edited-image-${Date.now()}.png`;
    link.href = canvas.toDataURL();
    
    // Trigger download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showSuccessMessage('تم حفظ الصورة بنجاح');
}

// Enhanced Image Functions
function printImage() {
    if (!canvas) {
        alert('لا توجد صورة للطباعة');
        return;
    }
    
    const printWindow = window.open('', '_blank');
    const imageDataUrl = canvas.toDataURL();
    
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>طباعة الصورة</title>
            <style>
                body { 
                    margin: 0; 
                    padding: 20px; 
                    display: flex; 
                    justify-content: center; 
                    align-items: center; 
                    min-height: 100vh;
                }
                img { 
                    max-width: 100%; 
                    max-height: 100vh; 
                    object-fit: contain;
                }
                @media print {
                    body { padding: 0; }
                    img { width: 100%; height: auto; }
                }
            </style>
        </head>
        <body>
            <img src="${imageDataUrl}" alt="صورة للطباعة">
        </body>
        </html>
    `);
    
    printWindow.document.close();
    printWindow.onload = () => {
        printWindow.print();
    };
    
    showSuccessMessage('تم إعداد الصورة للطباعة');
}

function saveAsTemplate() {
    if (!currentImage || textElements.length === 0) {
        alert('يجب إضافة نصوص أولاً لحفظ القالب');
        return;
    }
    
    const templateName = prompt('أدخل اسم القالب:');
    if (!templateName) return;
    
    const imageTemplate = {
        id: generateId(),
        name: templateName,
        category: 'مخصص',
        description: 'قالب محفوظ من محرر الصور',
        imageData: canvas.toDataURL(),
        textElements: JSON.parse(JSON.stringify(textElements)),
        createdAt: new Date().toISOString()
    };
    
    imageTemplates.push(imageTemplate);
    saveImageTemplates();
    loadImageTemplates();
    
    showSuccessMessage('تم حفظ القالب بنجاح');
}

function loadImageTemplate() {
    if (imageTemplates.length === 0) {
        alert('لا توجد قوالب محفوظة');
        return;
    }
    
    let templateOptions = 'اختر قالب للتطبيق:\n\n';
    imageTemplates.forEach((template, index) => {
        templateOptions += `${index + 1}. ${template.name}\n`;
    });
    
    const choice = prompt(templateOptions + '\nأدخل رقم القالب:');
    if (!choice) return;
    
    const templateIndex = parseInt(choice) - 1;
    if (templateIndex < 0 || templateIndex >= imageTemplates.length) {
        alert('رقم القالب غير صحيح');
        return;
    }
    
    const template = imageTemplates[templateIndex];
    
    // Load template image
    const img = new Image();
    img.onload = () => {
        currentImage = img;
        setupCanvas();
        
        // Load template text elements
        textElements = JSON.parse(JSON.stringify(template.textElements));
        selectedTextElement = null;
        
        redrawCanvas();
        updateTextElementsList();
        
        showSuccessMessage('تم تطبيق القالب بنجاح');
    };
    img.src = template.imageData;
}

// Image Templates Management
function loadImageTemplates() {
    const templatesGrid = document.getElementById('image-templates-grid');
    if (!templatesGrid) return;
    
    templatesGrid.innerHTML = '';
    
    if (imageTemplates.length === 0) {
        templatesGrid.innerHTML = `
            <div class="card" style="grid-column: 1 / -1; text-align: center; padding: 3rem;">
                <i class="fas fa-layer-group" style="font-size: 3rem; color: #ccc; margin-bottom: 1rem;"></i>
                <p style="color: #666;">لا توجد قوالب صور حالياً. قم بإضافة قالب جديد للبدء.</p>
            </div>
        `;
        return;
    }
    
    imageTemplates.forEach(template => {
        const templateCard = createImageTemplateCard(template);
        templatesGrid.appendChild(templateCard);
    });
}

function createImageTemplateCard(template) {
    const card = document.createElement('div');
    card.className = 'template-card';
    
    card.innerHTML = `
        <div class="template-header">
            <h3 class="template-title">${template.name}</h3>
            <span class="template-category">${template.category}</span>
        </div>
        <div class="template-preview" style="margin: 1rem 0;">
            <img src="${template.imageData}" alt="${template.name}" 
                 style="width: 100%; height: 150px; object-fit: cover; border-radius: 8px;">
        </div>
        <p class="template-description">${template.description}</p>
        <div class="template-info">
            <small>عدد النصوص: ${template.textElements.length}</small>
        </div>
        <div class="template-actions">
            <button class="btn btn-info" onclick="useImageTemplate('${template.id}')">
                <i class="fas fa-play"></i> استخدام
            </button>
            <button class="btn btn-warning" onclick="editImageTemplate('${template.id}')">
                <i class="fas fa-edit"></i> تعديل
            </button>
            <button class="btn btn-danger" onclick="deleteImageTemplate('${template.id}')">
                <i class="fas fa-trash"></i> حذف
            </button>
        </div>
    `;
    
    return card;
}

function showAddImageTemplateForm() {
    editingImageTemplateId = null;
    document.getElementById('image-template-modal-title').textContent = 'إضافة قالب صورة جديد';
    document.getElementById('image-template-form').reset();
    showModal('image-template-modal');
}

function editImageTemplate(templateId) {
    const template = imageTemplates.find(t => t.id === templateId);
    if (!template) return;
    
    editingImageTemplateId = templateId;
    document.getElementById('image-template-modal-title').textContent = 'تعديل قالب الصورة';
    
    document.getElementById('image-template-name').value = template.name;
    document.getElementById('image-template-category').value = template.category;
    document.getElementById('image-template-description').value = template.description;
    
    showModal('image-template-modal');
}

function handleImageTemplateSubmit(event) {
    event.preventDefault();
    
    const formData = {
        name: document.getElementById('image-template-name').value,
        category: document.getElementById('image-template-category').value,
        description: document.getElementById('image-template-description').value
    };
    
    if (editingImageTemplateId) {
        // Update existing template
        const templateIndex = imageTemplates.findIndex(t => t.id === editingImageTemplateId);
        if (templateIndex !== -1) {
            imageTemplates[templateIndex] = { ...imageTemplates[templateIndex], ...formData };
        }
    } else {
        // Add new template (basic template without image)
        const newTemplate = {
            id: generateId(),
            ...formData,
            imageData: '',
            textElements: [],
            createdAt: new Date().toISOString()
        };
        imageTemplates.push(newTemplate);
    }
    
    saveImageTemplates();
    loadImageTemplates();
    closeModal('image-template-modal');
    showSuccessMessage(editingImageTemplateId ? 'تم تحديث القالب بنجاح' : 'تم إضافة القالب بنجاح');
}

function deleteImageTemplate(templateId) {
    if (confirm('هل أنت متأكد من حذف هذا القالب؟')) {
        imageTemplates = imageTemplates.filter(t => t.id !== templateId);
        saveImageTemplates();
        loadImageTemplates();
        showSuccessMessage('تم حذف القالب بنجاح');
    }
}

function useImageTemplate(templateId) {
    const template = imageTemplates.find(t => t.id === templateId);
    if (!template) return;
    
    if (template.imageData) {
        const img = new Image();
        img.onload = () => {
            currentImage = img;
            setupCanvas();
            
            textElements = JSON.parse(JSON.stringify(template.textElements));
            selectedTextElement = null;
            
            redrawCanvas();
            updateTextElementsList();
            
            showPage('image-editor');
            document.getElementById('upload-area').style.display = 'none';
            document.getElementById('editor-workspace').style.display = 'grid';
            
            showSuccessMessage('تم تطبيق القالب بنجاح');
        };
        img.src = template.imageData;
    } else {
        showPage('image-editor');
        showSuccessMessage('تم اختيار القالب. قم بتحميل صورة للبدء');
    }
}

function saveImageTemplates() {
    localStorage.setItem('imageTemplates', JSON.stringify(imageTemplates));
}

// Statistics Functions
function updateStatistics() {
    const totalContracts = contracts.length;
    const activeContracts = contracts.filter(c => c.status === 'نشط').length;
    const completedContracts = contracts.filter(c => c.status === 'مكتمل').length;
    
    let totalValue = 0;
    contracts.forEach(contract => {
        totalValue += calculateContractTotal(contract.id);
    });
    
    // Update DOM elements
    const totalContractsEl = document.getElementById('total-contracts');
    const activeContractsEl = document.getElementById('active-contracts');
    const completedContractsEl = document.getElementById('completed-contracts');
    const totalValueEl = document.getElementById('total-value');
    
    if (totalContractsEl) totalContractsEl.textContent = totalContracts;
    if (activeContractsEl) activeContractsEl.textContent = activeContracts;
    if (completedContractsEl) completedContractsEl.textContent = completedContracts;
    if (totalValueEl) totalValueEl.textContent = formatCurrency(totalValue);
}

// Enhanced Contract Creation with Template Items
function handleContractSubmit(event) {
    event.preventDefault();
    
    const formData = {
        number: document.getElementById('contract-number').value,
        clientName: document.getElementById('client-name').value,
        type: document.getElementById('contract-type').value,
        status: document.getElementById('contract-status').value,
        startDate: document.getElementById('start-date').value,
        endDate: document.getElementById('end-date').value,
        phone: document.getElementById('phone').value,
        email: document.getElementById('email').value,
        address: document.getElementById('address').value,
        description: document.getElementById('description').value
    };
    
    if (editingContractId) {
        // Update existing contract
        const contractIndex = contracts.findIndex(c => c.id === editingContractId);
        if (contractIndex !== -1) {
            contracts[contractIndex] = { ...contracts[contractIndex], ...formData };
        }
    } else {
        // Add new contract
        const newContract = {
            id: generateId(),
            ...formData,
            items: currentTemplate && currentTemplate.items ? [...currentTemplate.items] : [],
            createdAt: new Date().toISOString()
        };
        contracts.push(newContract);
    }
    
    saveContracts();
    loadContracts();
    closeModal('contract-modal');
    showSuccessMessage(editingContractId ? 'تم تحديث العقد بنجاح' : 'تم إضافة العقد بنجاح');
    
    // Reset current template
    currentTemplate = null;
}

// Search Functions
function searchContracts() {
    const searchTerm = document.getElementById('contracts-search').value.toLowerCase();
    const tbody = document.getElementById('contracts-tbody');
    const rows = tbody.getElementsByTagName('tr');
    
    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const cells = row.getElementsByTagName('td');
        let found = false;
        
        for (let j = 0; j < cells.length - 1; j++) { // Exclude actions column
            if (cells[j].textContent.toLowerCase().includes(searchTerm)) {
                found = true;
                break;
            }
        }
        
        row.style.display = found ? '' : 'none';
    }
}

// Print Functions
function printContract(contractId) {
    const contract = contracts.find(c => c.id === contractId);
    if (!contract) return;
    
    const printWindow = window.open('', '_blank');
    const contractTotal = calculateContractTotal(contractId);
    
    printWindow.document.write(`
        <!DOCTYPE html>
        <html lang="ar" dir="rtl">
        <head>
            <meta charset="UTF-8">
            <title>عقد رقم ${contract.number}</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                .header { text-align: center; margin-bottom: 30px; }
                .info-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                .info-table td { padding: 8px; border: 1px solid #ddd; }
                .items-table { width: 100%; border-collapse: collapse; }
                .items-table th, .items-table td { padding: 8px; border: 1px solid #ddd; text-align: right; }
                .total { text-align: center; font-weight: bold; margin-top: 20px; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>عقد مقاولة رقم ${contract.number}</h1>
                <p>تاريخ الطباعة: ${new Date().toLocaleDateString('ar-SA')}</p>
            </div>
            
            <table class="info-table">
                <tr><td><strong>اسم العميل:</strong></td><td>${contract.clientName}</td></tr>
                <tr><td><strong>نوع العقد:</strong></td><td>${contract.type}</td></tr>
                <tr><td><strong>تاريخ البداية:</strong></td><td>${formatDate(contract.startDate)}</td></tr>
                <tr><td><strong>تاريخ النهاية:</strong></td><td>${formatDate(contract.endDate)}</td></tr>
                <tr><td><strong>رقم الهاتف:</strong></td><td>${contract.phone}</td></tr>
                <tr><td><strong>العنوان:</strong></td><td>${contract.address}</td></tr>
            </table>
            
            <h3>بنود العقد:</h3>
            <table class="items-table">
                <thead>
                    <tr>
                        <th>الوصف</th>
                        <th>الكمية</th>
                        <th>الوحدة</th>
                        <th>السعر</th>
                        <th>المجموع</th>
                    </tr>
                </thead>
                <tbody>
                    ${contract.items ? contract.items.map(item => `
                        <tr>
                            <td>${item.description}</td>
                            <td>${item.quantity}</td>
                            <td>${item.unit}</td>
                            <td>${formatCurrency(item.price)}</td>
                            <td>${formatCurrency(item.quantity * item.price)}</td>
                        </tr>
                    `).join('') : ''}
                </tbody>
            </table>
            
            <div class="total">
                <h3>المجموع الكلي: ${formatCurrency(contractTotal)}</h3>
            </div>
        </body>
        </html>
    `);
    
    printWindow.document.close();
    printWindow.print();
}

// Client Management Functions
function loadClients() {
    const tbody = document.getElementById('clients-tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    clients.forEach(client => {
        const row = createClientRow(client);
        tbody.appendChild(row);
    });
    
    updateClientsStatistics();
    loadClientOptions();
}

function createClientRow(client) {
    const row = document.createElement('tr');
    
    // Count agreements for this client
    const agreementCount = agreements.filter(a => a.clientId === client.id).length;
    
    row.innerHTML = `
        <td>${client.name}</td>
        <td>${client.phone}</td>
        <td>${client.nationalId}</td>
        <td>${formatDate(client.createdAt)}</td>
        <td>${agreementCount}</td>
        <td>
            <div class="btn-group">
                <button class="btn btn-info btn-sm" onclick="viewClientAgreements('${client.id}')">
                    <i class="fas fa-handshake"></i> اتفاقيات
                </button>
                <button class="btn btn-warning btn-sm" onclick="editClient('${client.id}')">
                    <i class="fas fa-edit"></i> تعديل
                </button>
                <button class="btn btn-danger btn-sm" onclick="deleteClient('${client.id}')">
                    <i class="fas fa-trash"></i> حذف
                </button>
            </div>
        </td>
    `;
    
    return row;
}

function showAddClientForm() {
    editingClientId = null;
    document.getElementById('client-modal-title').textContent = 'إضافة عميل جديد';
    document.getElementById('client-form').reset();
    showModal('client-modal');
}

function editClient(clientId) {
    const client = clients.find(c => c.id === clientId);
    if (!client) return;
    
    editingClientId = clientId;
    document.getElementById('client-modal-title').textContent = 'تعديل بيانات العميل';
    
    // Fill form with client data
    document.getElementById('client-name').value = client.name;
    document.getElementById('client-phone').value = client.phone;
    document.getElementById('client-national-id').value = client.nationalId;
    document.getElementById('client-email').value = client.email || '';
    document.getElementById('client-city').value = client.city || '';
    document.getElementById('client-address').value = client.address || '';
    document.getElementById('client-notes').value = client.notes || '';
    
    showModal('client-modal');
}

function handleClientSubmit(event) {
    event.preventDefault();
    
    const formData = {
        name: document.getElementById('client-name').value,
        phone: document.getElementById('client-phone').value,
        nationalId: document.getElementById('client-national-id').value,
        email: document.getElementById('client-email').value,
        city: document.getElementById('client-city').value,
        address: document.getElementById('client-address').value,
        notes: document.getElementById('client-notes').value
    };
    
    // Validate national ID
    if (!isValidNationalId(formData.nationalId)) {
        showErrorMessage('رقم الهوية الوطنية غير صحيح');
        return;
    }
    
    // Validate phone number
    if (!isValidPhoneNumber(formData.phone)) {
        showErrorMessage('رقم الجوال غير صحيح');
        return;
    }
    
    if (editingClientId) {
        // Update existing client
        const clientIndex = clients.findIndex(c => c.id === editingClientId);
        if (clientIndex !== -1) {
            clients[clientIndex] = { ...clients[clientIndex], ...formData };
        }
    } else {
        // Add new client
        const newClient = {
            id: generateId(),
            ...formData,
            createdAt: new Date().toISOString()
        };
        clients.push(newClient);
    }
    
    saveClients();
    loadClients();
    closeModal('client-modal');
    showSuccessMessage(editingClientId ? 'تم تحديث بيانات العميل بنجاح' : 'تم إضافة العميل بنجاح');
}

function deleteClient(clientId) {
    const client = clients.find(c => c.id === clientId);
    if (!client) return;
    
    // Check if client has agreements
    const clientAgreements = agreements.filter(a => a.clientId === clientId);
    if (clientAgreements.length > 0) {
        showErrorMessage('لا يمكن حذف العميل لأنه لديه اتفاقيات مرتبطة');
        return;
    }
    
    if (confirm(`هل أنت متأكد من حذف العميل ${client.name}؟`)) {
        clients = clients.filter(c => c.id !== clientId);
        saveClients();
        loadClients();
        showSuccessMessage('تم حذف العميل بنجاح');
    }
}

function viewClientAgreements(clientId) {
    const client = clients.find(c => c.id === clientId);
    if (!client) return;
    
    // Filter agreements for this client
    const clientAgreements = agreements.filter(a => a.clientId === clientId);
    
    // Show agreements page with filtered results
    showPage('agreements');
    
    // You can implement filtering here or show a modal with client agreements
    showSuccessMessage(`عرض اتفاقيات العميل: ${client.name}`);
}

function updateClientsStatistics() {
    const totalClients = clients.length;
    const activeAgreements = agreements.filter(a => a.status === 'نشط').length;
    const completedAgreements = agreements.filter(a => a.status === 'مكتمل').length;
    
    const totalClientsEl = document.getElementById('total-clients');
    const activeAgreementsEl = document.getElementById('active-agreements');
    const completedAgreementsEl = document.getElementById('completed-agreements');
    
    if (totalClientsEl) totalClientsEl.textContent = totalClients;
    if (activeAgreementsEl) activeAgreementsEl.textContent = activeAgreements;
    if (completedAgreementsEl) completedAgreementsEl.textContent = completedAgreements;
}

function searchClients() {
    const searchTerm = document.getElementById('clients-search').value.toLowerCase();
    const tbody = document.getElementById('clients-tbody');
    const rows = tbody.getElementsByTagName('tr');
    
    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const cells = row.getElementsByTagName('td');
        let found = false;
        
        for (let j = 0; j < cells.length - 1; j++) { // Exclude actions column
            if (cells[j].textContent.toLowerCase().includes(searchTerm)) {
                found = true;
                break;
            }
        }
        
        row.style.display = found ? '' : 'none';
    }
}

function loadClientOptions() {
    const clientSelect = document.getElementById('agreement-client');
    if (!clientSelect) return;
    
    clientSelect.innerHTML = '<option value="">اختر العميل</option>';
    
    clients.forEach(client => {
        const option = document.createElement('option');
        option.value = client.id;
        option.textContent = client.name;
        clientSelect.appendChild(option);
    });
}

function saveClients() {
    localStorage.setItem('clients', JSON.stringify(clients));
}

// Validation Functions
function isValidNationalId(nationalId) {
    // Saudi National ID validation (10 digits)
    return /^[0-9]{10}$/.test(nationalId);
}

function isValidPhoneNumber(phone) {
    // Saudi phone number validation
    return /^05[0-9]{8}$/.test(phone);
}

// Agreement Management Functions
function loadAgreements() {
    const tbody = document.getElementById('agreements-tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    agreements.forEach(agreement => {
        const row = createAgreementRow(agreement);
        tbody.appendChild(row);
    });
    
    updateClientsStatistics();
}

function createAgreementRow(agreement) {
    const row = document.createElement('tr');
    const client = clients.find(c => c.id === agreement.clientId);
    const clientName = client ? client.name : 'غير محدد';
    const statusClass = getStatusClass(agreement.status);
    
    row.innerHTML = `
        <td>${agreement.number}</td>
        <td>${clientName}</td>
        <td>${agreement.type}</td>
        <td>${formatDate(agreement.startDate)}</td>
        <td>${formatDate(agreement.endDate)}</td>
        <td><span class="status-badge ${statusClass}">${agreement.status}</span></td>
        <td>
            <div class="btn-group">
                <button class="btn btn-info btn-sm" onclick="viewAgreement('${agreement.id}')">
                    <i class="fas fa-eye"></i> عرض
                </button>
                <button class="btn btn-primary btn-sm" onclick="sendAgreementEmailFromList('${agreement.id}')">
                    <i class="fas fa-envelope"></i> إرسال
                </button>
                <button class="btn btn-warning btn-sm" onclick="editAgreement('${agreement.id}')">
                    <i class="fas fa-edit"></i> تعديل
                </button>
                <button class="btn btn-success btn-sm" onclick="printAgreement('${agreement.id}')">
                    <i class="fas fa-print"></i> طباعة
                </button>
                <button class="btn btn-danger btn-sm" onclick="deleteAgreement('${agreement.id}')">
                    <i class="fas fa-trash"></i> حذف
                </button>
            </div>
        </td>
    `;
    
    return row;
}

function showAddAgreementForm() {
    editingAgreementId = null;
    document.getElementById('agreement-modal-title').textContent = 'إضافة اتفاقية جديدة';
    document.getElementById('agreement-form').reset();
    
    // Generate agreement number automatically
    const agreementNumber = generateAgreementNumber();
    document.getElementById('agreement-number').value = agreementNumber;
    
    // Set default dates
    const today = new Date().toISOString().split('T')[0];
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    const nextMonthStr = nextMonth.toISOString().split('T')[0];
    
    document.getElementById('agreement-start-date').value = today;
    document.getElementById('agreement-end-date').value = nextMonthStr;
    
    showModal('agreement-modal');
}

function editAgreement(agreementId) {
    const agreement = agreements.find(a => a.id === agreementId);
    if (!agreement) return;
    
    editingAgreementId = agreementId;
    document.getElementById('agreement-modal-title').textContent = 'تعديل الاتفاقية';
    
    // Fill form with agreement data
    document.getElementById('agreement-number').value = agreement.number;
    document.getElementById('agreement-client').value = agreement.clientId;
    document.getElementById('agreement-type').value = agreement.type;
    document.getElementById('agreement-status').value = agreement.status;
    document.getElementById('agreement-start-date').value = agreement.startDate;
    document.getElementById('agreement-end-date').value = agreement.endDate;
    document.getElementById('building-type').value = agreement.buildingType || '';
    document.getElementById('land-area').value = agreement.landArea || '';
    document.getElementById('building-area').value = agreement.buildingArea || '';
    document.getElementById('floors-count').value = agreement.floorsCount || '';
    document.getElementById('building-specs').value = agreement.buildingSpecs || '';
    document.getElementById('finishing-type').value = agreement.finishingType || '';
    document.getElementById('finishing-specs').value = agreement.finishingSpecs || '';
    document.getElementById('general-terms').value = agreement.generalTerms || '';
    document.getElementById('financial-terms').value = agreement.financialTerms || '';
    document.getElementById('technical-terms').value = agreement.technicalTerms || '';
    document.getElementById('agreement-notes').value = agreement.notes || '';
    
    showModal('agreement-modal');
}

function handleAgreementSubmit(event) {
    event.preventDefault();
    
    const formData = {
        number: document.getElementById('agreement-number').value,
        clientId: document.getElementById('agreement-client').value,
        type: document.getElementById('agreement-type').value,
        status: document.getElementById('agreement-status').value,
        startDate: document.getElementById('agreement-start-date').value,
        endDate: document.getElementById('agreement-end-date').value,
        buildingType: document.getElementById('building-type').value,
        landArea: document.getElementById('land-area').value,
        buildingArea: document.getElementById('building-area').value,
        floorsCount: document.getElementById('floors-count').value,
        buildingSpecs: document.getElementById('building-specs').value,
        finishingType: document.getElementById('finishing-type').value,
        finishingSpecs: document.getElementById('finishing-specs').value,
        generalTerms: document.getElementById('general-terms').value,
        financialTerms: document.getElementById('financial-terms').value,
        technicalTerms: document.getElementById('technical-terms').value,
        notes: document.getElementById('agreement-notes').value
    };
    
    if (editingAgreementId) {
        // Update existing agreement
        const agreementIndex = agreements.findIndex(a => a.id === editingAgreementId);
        if (agreementIndex !== -1) {
            agreements[agreementIndex] = { ...agreements[agreementIndex], ...formData };
        }
    } else {
        // Add new agreement
        const newAgreement = {
            id: generateId(),
            ...formData,
            createdAt: new Date().toISOString(),
            companyName: 'مؤسسة القمة والتطوير للمقاولات العامة',
            companySignature: '', // Will be added when signing
            clientSignature: '' // Will be added when signing
        };
        agreements.push(newAgreement);
    }
    
    saveAgreements();
    loadAgreements();
    closeModal('agreement-modal');
    showSuccessMessage(editingAgreementId ? 'تم تحديث الاتفاقية بنجاح' : 'تم إضافة الاتفاقية بنجاح');
}

function deleteAgreement(agreementId) {
    const agreement = agreements.find(a => a.id === agreementId);
    if (!agreement) return;
    
    if (confirm(`هل أنت متأكد من حذف الاتفاقية ${agreement.number}؟`)) {
        agreements = agreements.filter(a => a.id !== agreementId);
        saveAgreements();
        loadAgreements();
        showSuccessMessage('تم حذف الاتفاقية بنجاح');
    }
}

function viewAgreement(agreementId) {
    currentAgreement = agreements.find(a => a.id === agreementId);
    if (!currentAgreement) return;
    
    displayAgreementDetails();
    showPage('agreement-details');
}

function displayAgreementDetails() {
    if (!currentAgreement) return;
    
    const client = clients.find(c => c.id === currentAgreement.clientId);
    const clientName = client ? client.name : 'غير محدد';
    
    document.getElementById('agreement-details-title').textContent = `تفاصيل الاتفاقية - ${currentAgreement.number}`;
    
    const agreementContent = document.getElementById('agreement-content');
    agreementContent.innerHTML = `
        <div class="agreement-header">
            <h1 class="agreement-title">اتفاقية عمل</h1>
            <p class="agreement-subtitle">مؤسسة القمة والتطوير للمقاولات العامة</p>
            <p>رقم الاتفاقية: ${currentAgreement.number}</p>
        </div>
        
        <div class="agreement-info">
            <div class="agreement-section">
                <h3>معلومات الاتفاقية</h3>
                <div class="agreement-details">
                    <div class="agreement-detail">
                        <span class="agreement-detail-label">رقم الاتفاقية:</span>
                        <span class="agreement-detail-value">${currentAgreement.number}</span>
                    </div>
                    <div class="agreement-detail">
                        <span class="agreement-detail-label">اسم العميل:</span>
                        <span class="agreement-detail-value">${clientName}</span>
                    </div>
                    <div class="agreement-detail">
                        <span class="agreement-detail-label">نوع العمل:</span>
                        <span class="agreement-detail-value">${currentAgreement.type}</span>
                    </div>
                    <div class="agreement-detail">
                        <span class="agreement-detail-label">الحالة:</span>
                        <span class="agreement-detail-value">
                            <span class="status-badge ${getStatusClass(currentAgreement.status)}">${currentAgreement.status}</span>
                        </span>
                    </div>
                    <div class="agreement-detail">
                        <span class="agreement-detail-label">تاريخ البداية:</span>
                        <span class="agreement-detail-value">${formatDate(currentAgreement.startDate)}</span>
                    </div>
                    <div class="agreement-detail">
                        <span class="agreement-detail-label">تاريخ النهاية:</span>
                        <span class="agreement-detail-value">${formatDate(currentAgreement.endDate)}</span>
                    </div>
                </div>
            </div>
            
            ${currentAgreement.buildingType ? `
            <div class="agreement-section">
                <h3>مواصفات البناء</h3>
                <div class="agreement-details">
                    <div class="agreement-detail">
                        <span class="agreement-detail-label">نوع البناء:</span>
                        <span class="agreement-detail-value">${currentAgreement.buildingType}</span>
                    </div>
                    ${currentAgreement.landArea ? `
                    <div class="agreement-detail">
                        <span class="agreement-detail-label">مساحة الأرض:</span>
                        <span class="agreement-detail-value">${currentAgreement.landArea} م²</span>
                    </div>
                    ` : ''}
                    ${currentAgreement.buildingArea ? `
                    <div class="agreement-detail">
                        <span class="agreement-detail-label">مساحة البناء:</span>
                        <span class="agreement-detail-value">${currentAgreement.buildingArea} م²</span>
                    </div>
                    ` : ''}
                    ${currentAgreement.floorsCount ? `
                    <div class="agreement-detail">
                        <span class="agreement-detail-label">عدد الطوابق:</span>
                        <span class="agreement-detail-value">${currentAgreement.floorsCount}</span>
                    </div>
                    ` : ''}
                </div>
                ${currentAgreement.buildingSpecs ? `
                <div class="agreement-detail">
                    <span class="agreement-detail-label">مواصفات البناء التفصيلية:</span>
                    <div class="agreement-detail-value">${currentAgreement.buildingSpecs}</div>
                </div>
                ` : ''}
            </div>
            ` : ''}
            
            ${currentAgreement.finishingType ? `
            <div class="agreement-section">
                <h3>التشطيبات</h3>
                <div class="agreement-details">
                    <div class="agreement-detail">
                        <span class="agreement-detail-label">نوع التشطيب:</span>
                        <span class="agreement-detail-value">${currentAgreement.finishingType}</span>
                    </div>
                </div>
                ${currentAgreement.finishingSpecs ? `
                <div class="agreement-detail">
                    <span class="agreement-detail-label">مواصفات التشطيبات:</span>
                    <div class="agreement-detail-value">${currentAgreement.finishingSpecs}</div>
                </div>
                ` : ''}
            </div>
            ` : ''}
            
            ${currentAgreement.generalTerms || currentAgreement.financialTerms || currentAgreement.technicalTerms ? `
            <div class="agreement-section">
                <h3>الشروط والأحكام</h3>
                ${currentAgreement.generalTerms ? `
                <div class="agreement-detail">
                    <span class="agreement-detail-label">الشروط العامة:</span>
                    <div class="agreement-detail-value">${currentAgreement.generalTerms}</div>
                </div>
                ` : ''}
                ${currentAgreement.financialTerms ? `
                <div class="agreement-detail">
                    <span class="agreement-detail-label">الشروط المالية:</span>
                    <div class="agreement-detail-value">${currentAgreement.financialTerms}</div>
                </div>
                ` : ''}
                ${currentAgreement.technicalTerms ? `
                <div class="agreement-detail">
                    <span class="agreement-detail-label">الشروط الفنية:</span>
                    <div class="agreement-detail-value">${currentAgreement.technicalTerms}</div>
                </div>
                ` : ''}
            </div>
            ` : ''}
            
            ${currentAgreement.notes ? `
            <div class="agreement-section">
                <h3>ملاحظات إضافية</h3>
                <div class="agreement-detail">
                    <div class="agreement-detail-value">${currentAgreement.notes}</div>
                </div>
            </div>
            ` : ''}
        </div>
        
        <div class="agreement-signatures">
            <div class="signature-block">
                <div class="signature-title">توقيع الطرف الأول</div>
                <div class="signature-box ${currentAgreement.companySignature ? 'signed' : ''}">
                    ${currentAgreement.companySignature ? 
                        `<img src="${currentAgreement.companySignature}" alt="توقيع الشركة">` : 
                        '<span style="color: #999;">انقر على "توقيع الشركة" لإضافة التوقيع</span>'
                    }
                </div>
                <div class="signature-info">
                    مؤسسة القمة والتطوير للمقاولات العامة<br>
                    ${formatDate(new Date().toISOString())}
                </div>
            </div>
            
            <div class="signature-block">
                <div class="signature-title">توقيع الطرف الثاني</div>
                <div class="signature-box ${currentAgreement.clientSignature ? 'signed' : ''}">
                    ${currentAgreement.clientSignature ? 
                        `<img src="${currentAgreement.clientSignature}" alt="توقيع العميل">` : 
                        '<span style="color: #999;">انقر على "توقيع العميل" لإضافة التوقيع</span>'
                    }
                </div>
                <div class="signature-info">
                    ${clientName}<br>
                    ${formatDate(new Date().toISOString())}
                </div>
            </div>
        </div>
    `;
}

function printAgreement(agreementId) {
    if (!agreementId) agreementId = currentAgreement?.id;
    if (!agreementId) return;
    
    const agreement = agreements.find(a => a.id === agreementId);
    if (!agreement) return;
    
    const client = clients.find(c => c.id === agreement.clientId);
    const clientName = client ? client.name : 'غير محدد';
    
    const printWindow = window.open('', '_blank');
    
    printWindow.document.write(`
        <!DOCTYPE html>
        <html lang="ar" dir="rtl">
        <head>
            <meta charset="UTF-8">
            <title>اتفاقية عمل - ${agreement.number}</title>
            <style>
                body { 
                    font-family: 'Cairo', Arial, sans-serif; 
                    margin: 0; 
                    padding: 20px; 
                    line-height: 1.6;
                    color: #333;
                }
                .agreement-header {
                    text-align: center;
                    margin-bottom: 30px;
                    padding-bottom: 20px;
                    border-bottom: 3px solid #667eea;
                }
                .agreement-title {
                    font-size: 2rem;
                    color: #2c3e50;
                    margin-bottom: 10px;
                    font-weight: 700;
                }
                .agreement-subtitle {
                    font-size: 1.2rem;
                    color: #667eea;
                    margin-bottom: 20px;
                }
                .agreement-section {
                    margin-bottom: 20px;
                    padding: 15px;
                    background: #f8f9fa;
                    border-radius: 8px;
                    border-right: 4px solid #667eea;
                }
                .agreement-section h3 {
                    color: #2c3e50;
                    margin-bottom: 15px;
                    font-size: 1.3rem;
                }
                .agreement-details {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                    gap: 10px;
                }
                .agreement-detail {
                    display: flex;
                    flex-direction: column;
                    gap: 5px;
                }
                .agreement-detail-label {
                    font-weight: 600;
                    color: #6c757d;
                    font-size: 0.9rem;
                }
                .agreement-detail-value {
                    color: #2c3e50;
                    font-size: 1rem;
                    padding: 8px;
                    background: white;
                    border-radius: 4px;
                    border: 1px solid #e9ecef;
                }
                .agreement-signatures {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 30px;
                    margin-top: 30px;
                    padding-top: 20px;
                    border-top: 2px solid #e9ecef;
                }
                .signature-block {
                    text-align: center;
                }
                .signature-title {
                    font-weight: 600;
                    color: #2c3e50;
                    margin-bottom: 10px;
                }
                .signature-box {
                    height: 100px;
                    border: 2px solid #000;
                    border-radius: 8px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: white;
                    margin-bottom: 10px;
                }
                .signature-info {
                    font-size: 0.9rem;
                    color: #6c757d;
                }
                @page {
                    margin: 2cm;
                    size: A4;
                }
            </style>
        </head>
        <body>
            <div class="agreement-header">
                <h1 class="agreement-title">اتفاقية عمل</h1>
                <p class="agreement-subtitle">مؤسسة القمة والتطوير للمقاولات العامة</p>
                <p>رقم الاتفاقية: ${agreement.number}</p>
            </div>
            
            <div class="agreement-section">
                <h3>معلومات الاتفاقية</h3>
                <div class="agreement-details">
                    <div class="agreement-detail">
                        <span class="agreement-detail-label">رقم الاتفاقية:</span>
                        <span class="agreement-detail-value">${agreement.number}</span>
                    </div>
                    <div class="agreement-detail">
                        <span class="agreement-detail-label">اسم العميل:</span>
                        <span class="agreement-detail-value">${clientName}</span>
                    </div>
                    <div class="agreement-detail">
                        <span class="agreement-detail-label">نوع العمل:</span>
                        <span class="agreement-detail-value">${agreement.type}</span>
                    </div>
                    <div class="agreement-detail">
                        <span class="agreement-detail-label">الحالة:</span>
                        <span class="agreement-detail-value">${agreement.status}</span>
                    </div>
                    <div class="agreement-detail">
                        <span class="agreement-detail-label">تاريخ البداية:</span>
                        <span class="agreement-detail-value">${formatDate(agreement.startDate)}</span>
                    </div>
                    <div class="agreement-detail">
                        <span class="agreement-detail-label">تاريخ النهاية:</span>
                        <span class="agreement-detail-value">${formatDate(agreement.endDate)}</span>
                    </div>
                </div>
            </div>
            
            ${agreement.buildingType ? `
            <div class="agreement-section">
                <h3>مواصفات البناء</h3>
                <div class="agreement-details">
                    <div class="agreement-detail">
                        <span class="agreement-detail-label">نوع البناء:</span>
                        <span class="agreement-detail-value">${agreement.buildingType}</span>
                    </div>
                    ${agreement.landArea ? `
                    <div class="agreement-detail">
                        <span class="agreement-detail-label">مساحة الأرض:</span>
                        <span class="agreement-detail-value">${agreement.landArea} م²</span>
                    </div>
                    ` : ''}
                    ${agreement.buildingArea ? `
                    <div class="agreement-detail">
                        <span class="agreement-detail-label">مساحة البناء:</span>
                        <span class="agreement-detail-value">${agreement.buildingArea} م²</span>
                    </div>
                    ` : ''}
                    ${agreement.floorsCount ? `
                    <div class="agreement-detail">
                        <span class="agreement-detail-label">عدد الطوابق:</span>
                        <span class="agreement-detail-value">${agreement.floorsCount}</span>
                    </div>
                    ` : ''}
                </div>
                ${agreement.buildingSpecs ? `
                <div class="agreement-detail">
                    <span class="agreement-detail-label">مواصفات البناء التفصيلية:</span>
                    <div class="agreement-detail-value">${agreement.buildingSpecs}</div>
                </div>
                ` : ''}
            </div>
            ` : ''}
            
            ${agreement.finishingType ? `
            <div class="agreement-section">
                <h3>التشطيبات</h3>
                <div class="agreement-details">
                    <div class="agreement-detail">
                        <span class="agreement-detail-label">نوع التشطيب:</span>
                        <span class="agreement-detail-value">${agreement.finishingType}</span>
                    </div>
                </div>
                ${agreement.finishingSpecs ? `
                <div class="agreement-detail">
                    <span class="agreement-detail-label">مواصفات التشطيبات:</span>
                    <div class="agreement-detail-value">${agreement.finishingSpecs}</div>
                </div>
                ` : ''}
            </div>
            ` : ''}
            
            ${agreement.generalTerms || agreement.financialTerms || agreement.technicalTerms ? `
            <div class="agreement-section">
                <h3>الشروط والأحكام</h3>
                ${agreement.generalTerms ? `
                <div class="agreement-detail">
                    <span class="agreement-detail-label">الشروط العامة:</span>
                    <div class="agreement-detail-value">${agreement.generalTerms}</div>
                </div>
                ` : ''}
                ${agreement.financialTerms ? `
                <div class="agreement-detail">
                    <span class="agreement-detail-label">الشروط المالية:</span>
                    <div class="agreement-detail-value">${agreement.financialTerms}</div>
                </div>
                ` : ''}
                ${agreement.technicalTerms ? `
                <div class="agreement-detail">
                    <span class="agreement-detail-label">الشروط الفنية:</span>
                    <div class="agreement-detail-value">${agreement.technicalTerms}</div>
                </div>
                ` : ''}
            </div>
            ` : ''}
            
            ${agreement.notes ? `
            <div class="agreement-section">
                <h3>ملاحظات إضافية</h3>
                <div class="agreement-detail">
                    <div class="agreement-detail-value">${agreement.notes}</div>
                </div>
            </div>
            ` : ''}
            
            <div class="agreement-signatures">
                <div class="signature-block">
                    <div class="signature-title">توقيع الطرف الأول</div>
                    <div class="signature-box">
                        ${agreement.companySignature ? 
                            `<img src="${agreement.companySignature}" alt="توقيع الشركة" style="max-height: 80px; max-width: 100%;">` : 
                            '<span>مؤسسة القمة والتطوير للمقاولات العامة</span>'
                        }
                    </div>
                    <div class="signature-info">
                        مؤسسة القمة والتطوير للمقاولات العامة<br>
                        ${formatDate(new Date().toISOString())}
                    </div>
                </div>
                
                <div class="signature-block">
                    <div class="signature-title">توقيع الطرف الثاني</div>
                    <div class="signature-box">
                        ${agreement.clientSignature ? 
                            `<img src="${agreement.clientSignature}" alt="توقيع العميل" style="max-height: 80px; max-width: 100%;">` : 
                            `<span>${clientName}</span>`
                        }
                    </div>
                    <div class="signature-info">
                        ${clientName}<br>
                        ${formatDate(new Date().toISOString())}
                    </div>
                </div>
            </div>
        </body>
        </html>
    `);
    
    printWindow.document.close();
    printWindow.onload = () => {
        printWindow.print();
    };
    
    showSuccessMessage('تم إعداد الاتفاقية للطباعة');
}

function searchAgreements() {
    const searchTerm = document.getElementById('agreements-search').value.toLowerCase();
    const tbody = document.getElementById('agreements-tbody');
    const rows = tbody.getElementsByTagName('tr');
    
    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const cells = row.getElementsByTagName('td');
        let found = false;
        
        for (let j = 0; j < cells.length - 1; j++) { // Exclude actions column
            if (cells[j].textContent.toLowerCase().includes(searchTerm)) {
                found = true;
                break;
            }
        }
        
        row.style.display = found ? '' : 'none';
    }
}

function saveAgreements() {
    localStorage.setItem('agreements', JSON.stringify(agreements));
}

// Auto-generate Contract Number
function generateContractNumber() {
    // Find the highest contract number
    let maxNumber = 0;
    
    contracts.forEach(contract => {
        const match = contract.number.match(/SA(\d+)/);
        if (match) {
            const num = parseInt(match[1]);
            if (num > maxNumber) {
                maxNumber = num;
            }
        }
    });
    
    // Generate next number
    const nextNumber = maxNumber + 1;
    return `SA${String(nextNumber).padStart(4, '0')}`;
}

// Auto-generate Agreement Number
function generateAgreementNumber() {
    // Find the highest agreement number
    let maxNumber = 0;
    
    agreements.forEach(agreement => {
        const match = agreement.number.match(/SA(\d+)/);
        if (match) {
            const num = parseInt(match[1]);
            if (num > maxNumber) {
                maxNumber = num;
            }
        }
    });
    
    // Generate next number
    const nextNumber = maxNumber + 1;
    return `SA${String(nextNumber).padStart(4, '0')}`;
}

// Electronic Signature Functions
function setupSignatureCanvas() {
    signatureCanvas = document.getElementById('signature-canvas');
    if (!signatureCanvas) return;
    
    signatureCtx = signatureCanvas.getContext('2d');
    
    // Set canvas size
    const container = signatureCanvas.parentElement;
    signatureCanvas.width = container.clientWidth - 40;
    signatureCanvas.height = 250;
    
    // Setup drawing events
    signatureCanvas.addEventListener('mousedown', startSignature);
    signatureCanvas.addEventListener('mousemove', drawSignature);
    signatureCanvas.addEventListener('mouseup', endSignature);
    signatureCanvas.addEventListener('mouseleave', endSignature);
    
    // Touch events for mobile
    signatureCanvas.addEventListener('touchstart', handleTouchStart);
    signatureCanvas.addEventListener('touchmove', handleTouchMove);
    signatureCanvas.addEventListener('touchend', endSignature);
    
    // Initialize signature context
    signatureCtx.strokeStyle = '#000';
    signatureCtx.lineWidth = 2;
    signatureCtx.lineCap = 'round';
    signatureCtx.lineJoin = 'round';
}

function startSignature(e) {
    isSignatureDrawing = true;
    const rect = signatureCanvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    signatureCtx.beginPath();
    signatureCtx.moveTo(x, y);
    e.preventDefault();
}

function drawSignature(e) {
    if (!isSignatureDrawing) return;
    
    const rect = signatureCanvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    signatureCtx.lineTo(x, y);
    signatureCtx.stroke();
    e.preventDefault();
}

function endSignature(e) {
    isSignatureDrawing = false;
    e.preventDefault();
}

function handleTouchStart(e) {
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent('mousedown', {
        clientX: touch.clientX,
        clientY: touch.clientY
    });
    signatureCanvas.dispatchEvent(mouseEvent);
    e.preventDefault();
}

function handleTouchMove(e) {
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent('mousemove', {
        clientX: touch.clientX,
        clientY: touch.clientY
    });
    signatureCanvas.dispatchEvent(mouseEvent);
    e.preventDefault();
}

function clearSignature() {
    signatureCtx.clearRect(0, 0, signatureCanvas.width, signatureCanvas.height);
}

function signAgreementAsCompany() {
    if (!currentAgreement) return;
    
    signatureType = 'company';
    currentSigningAgreementId = currentAgreement.id;
    
    document.getElementById('signature-modal-title').textContent = 'توقيع مؤسسة القمة والتطوير';
    document.getElementById('signature-instruction').textContent = 'يرجى التوقيع باسم مؤسسة القمة والتطوير للمقاولات العامة:';
    
    clearSignature();
    showModal('signature-modal');
}

function signAgreementAsClient() {
    if (!currentAgreement) return;
    
    const client = clients.find(c => c.id === currentAgreement.clientId);
    if (!client) {
        showErrorMessage('لم يتم العثور على بيانات العميل');
        return;
    }
    
    signatureType = 'client';
    currentSigningAgreementId = currentAgreement.id;
    
    document.getElementById('signature-modal-title').textContent = 'توقيع العميل';
    document.getElementById('signature-instruction').textContent = `يرجى التوقيع باسم العميل: ${client.name}`;
    
    clearSignature();
    showModal('signature-modal');
}

function saveSignature() {
    // Check if canvas is empty
    const imageData = signatureCtx.getImageData(0, 0, signatureCanvas.width, signatureCanvas.height);
    const pixels = imageData.data;
    let isEmpty = true;
    
    for (let i = 0; i < pixels.length; i += 4) {
        if (pixels[i + 3] !== 0) {
            isEmpty = false;
            break;
        }
    }
    
    if (isEmpty) {
        showErrorMessage('يرجى التوقيع أولاً');
        return;
    }
    
    // Convert canvas to data URL
    const signatureDataURL = signatureCanvas.toDataURL('image/png');
    
    // Find the agreement
    const agreementIndex = agreements.findIndex(a => a.id === currentSigningAgreementId);
    if (agreementIndex === -1) return;
    
    // Save signature based on type
    if (signatureType === 'company') {
        agreements[agreementIndex].companySignature = signatureDataURL;
        showSuccessMessage('تم حفظ توقيع الشركة بنجاح');
    } else if (signatureType === 'client') {
        agreements[agreementIndex].clientSignature = signatureDataURL;
        showSuccessMessage('تم حفظ توقيع العميل بنجاح');
    }
    
    // Save to localStorage
    saveAgreements();
    
    // Refresh the agreement display
    currentAgreement = agreements[agreementIndex];
    displayAgreementDetails();
    
    // Close modal
    closeModal('signature-modal');
    clearSignature();
}

// Send Agreement by Email
function sendAgreementByEmail() {
    if (!currentAgreement) return;
    
    const client = clients.find(c => c.id === currentAgreement.clientId);
    if (!client) {
        showErrorMessage('لم يتم العثور على بيانات العميل');
        return;
    }
    
    if (!client.email) {
        showErrorMessage('لا يوجد بريد إلكتروني مسجل للعميل');
        return;
    }
    
    // Generate agreement URL (for email content)
    const agreementLink = window.location.href;
    
    // Create email content
    const emailSubject = encodeURIComponent(`اتفاقية عمل - ${currentAgreement.number} - مؤسسة القمة والتطوير للمقاولات العامة`);
    
    const emailBody = encodeURIComponent(`
السيد/ة ${client.name} المحترم/ة،

تحية طيبة وبعد،

يسرنا في مؤسسة القمة والتطوير للمقاولات العامة أن نرسل لكم اتفاقية العمل رقم: ${currentAgreement.number}

تفاصيل الاتفاقية:
- رقم الاتفاقية: ${currentAgreement.number}
- نوع العمل: ${currentAgreement.type}
- تاريخ البداية: ${formatDate(currentAgreement.startDate)}
- تاريخ النهاية: ${formatDate(currentAgreement.endDate)}

يرجى مراجعة الاتفاقية والتوقيع عليها إلكترونياً.

للتوقيع على الاتفاقية، يرجى:
1. فتح رابط الاتفاقية
2. الضغط على زر "توقيع العميل"
3. التوقيع في المربع المخصص
4. حفظ التوقيع

نشكر لكم تعاونكم ونتطلع للعمل معكم.

مع أطيب التحيات،
مؤسسة القمة والتطوير للمقاولات العامة
    `);
    
    // Create mailto link
    const mailtoLink = `mailto:${client.email}?subject=${emailSubject}&body=${emailBody}`;
    
    // Open email client
    window.location.href = mailtoLink;
    
    showSuccessMessage(`تم فتح برنامج البريد الإلكتروني لإرسال الاتفاقية إلى: ${client.email}`);
}

// Generate shareable link for agreement
function generateAgreementLink(agreementId) {
    const baseUrl = window.location.origin + window.location.pathname;
    return `${baseUrl}?agreement=${agreementId}`;
}

// Check if URL contains agreement ID and load it
function checkAgreementFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    const agreementId = urlParams.get('agreement');
    
    if (agreementId) {
        const agreement = agreements.find(a => a.id === agreementId);
        if (agreement) {
            viewAgreement(agreementId);
        }
    }
}

// Send agreement email from list
function sendAgreementEmailFromList(agreementId) {
    const agreement = agreements.find(a => a.id === agreementId);
    if (!agreement) return;
    
    const client = clients.find(c => c.id === agreement.clientId);
    if (!client) {
        showErrorMessage('لم يتم العثور على بيانات العميل');
        return;
    }
    
    if (!client.email) {
        showErrorMessage('لا يوجد بريد إلكتروني مسجل للعميل');
        return;
    }
    
    // Set current agreement temporarily for email
    const tempAgreement = currentAgreement;
    currentAgreement = agreement;
    
    sendAgreementByEmail();
    
    // Restore previous agreement
    currentAgreement = tempAgreement;
}
