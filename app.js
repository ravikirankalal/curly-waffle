// 3D Financial Transaction Visualizer
// A novel way to visualize financial data in 3D space

class TransactionVisualizer {
    constructor() {
        this.container = document.getElementById('canvas-container');
        this.tooltip = document.getElementById('tooltip');
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.transactions = [];
        this.categories = {};
        this.categoryCenters = {};
        this.transactionMeshes = [];
        this.currentView = 'galaxy';
        this.animationId = null;
        
        this.init();
        this.generateSampleData();
        this.createVisualization();
        this.setupEventListeners();
        this.animate();
    }
    
    init() {
        // Scene setup
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x0a0a1a);
        
        // Camera setup
        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        this.camera.position.set(0, 30, 50);
        
        // Renderer setup
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.container.appendChild(this.renderer.domElement);
        
        // Controls
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.minDistance = 20;
        this.controls.maxDistance = 200;
        
        // Lighting
        const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
        this.scene.add(ambientLight);
        
        const pointLight1 = new THREE.PointLight(0x64c8ff, 1, 100);
        pointLight1.position.set(20, 20, 20);
        this.scene.add(pointLight1);
        
        const pointLight2 = new THREE.PointLight(0xff64b4, 0.8, 100);
        pointLight2.position.set(-20, -20, -20);
        this.scene.add(pointLight2);
        
        // Add stars background
        this.createStars();
        
        // Handle resize
        window.addEventListener('resize', () => this.onWindowResize());
    }
    
    createStars() {
        const starsGeometry = new THREE.BufferGeometry();
        const starsMaterial = new THREE.PointsMaterial({
            color: 0xffffff,
            size: 0.1,
            transparent: true,
            opacity: 0.8
        });
        
        const starsVertices = [];
        for (let i = 0; i < 5000; i++) {
            const x = (Math.random() - 0.5) * 500;
            const y = (Math.random() - 0.5) * 500;
            const z = (Math.random() - 0.5) * 500;
            starsVertices.push(x, y, z);
        }
        
        starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starsVertices, 3));
        const stars = new THREE.Points(starsGeometry, starsMaterial);
        this.scene.add(stars);
    }
    
    generateSampleData() {
        const categories = [
            'Salary', 'Investments', 'Shopping', 'Food', 
            'Transport', 'Entertainment', 'Utilities', 'Healthcare',
            'Travel', 'Education'
        ];
        
        const categoryColors = {
            'Salary': 0x64ff64,
            'Investments': 0x64c8ff,
            'Shopping': 0xff64ff,
            'Food': 0xffaa64,
            'Transport': 0xffff64,
            'Entertainment': 0xff6464,
            'Utilities': 0x64ffff,
            'Healthcare': 0xff64aa,
            'Travel': 0xaa64ff,
            'Education': 0xaaff64
        };
        
        // Generate 200 sample transactions
        for (let i = 0; i < 200; i++) {
            const category = categories[Math.floor(Math.random() * categories.length)];
            const isIncome = Math.random() > 0.6;
            const isTransfer = Math.random() > 0.9;
            
            let amount;
            if (isIncome) {
                amount = Math.random() * 5000 + 1000;
            } else if (isTransfer) {
                amount = Math.random() * 2000 + 100;
            } else {
                amount = -(Math.random() * 500 + 50);
            }
            
            const date = new Date();
            date.setDate(date.getDate() - Math.floor(Math.random() * 365));
            
            this.transactions.push({
                id: i,
                amount: amount,
                category: category,
                date: date,
                description: `${category} Transaction ${i + 1}`,
                type: isTransfer ? 'transfer' : (isIncome ? 'income' : 'expense'),
                color: categoryColors[category]
            });
        }
        
        // Group by category
        this.transactions.forEach(t => {
            if (!this.categories[t.category]) {
                this.categories[t.category] = [];
            }
            this.categories[t.category].push(t);
        });
        
        this.updateStats();
    }
    
    createVisualization() {
        this.clearVisualization();
        
        if (this.currentView === 'galaxy') {
            this.createGalaxyView();
        } else if (this.currentView === 'timeline') {
            this.createTimelineView();
        } else if (this.currentView === 'network') {
            this.createNetworkView();
        } else if (this.currentView === 'scatter') {
            this.createScatterView();
        }
    }
    
    clearVisualization() {
        this.transactionMeshes.forEach(mesh => {
            this.scene.remove(mesh);
            if (mesh.geometry) mesh.geometry.dispose();
            if (mesh.material) mesh.material.dispose();
        });
        this.transactionMeshes = [];
        
        Object.values(this.categoryCenters).forEach(center => {
            this.scene.remove(center.mesh);
            if (center.lines) {
                center.lines.forEach(line => this.scene.remove(line));
            }
        });
        this.categoryCenters = {};
    }
    
    createGalaxyView() {
        const categoryPositions = {};
        const radius = 25;
        const angleStep = (2 * Math.PI) / Object.keys(this.categories).length;
        
        // Create category centers
        Object.keys(this.categories).forEach((category, index) => {
            const angle = index * angleStep;
            const x = Math.cos(angle) * radius;
            const z = Math.sin(angle) * radius;
            const y = (this.categories[category].length / 20) * 2;
            
            // Category center sphere
            const geometry = new THREE.SphereGeometry(1.5, 32, 32);
            const material = new THREE.MeshPhongMaterial({
                color: this.transactions.find(t => t.category === category).color,
                emissive: this.transactions.find(t => t.category === category).color,
                emissiveIntensity: 0.5,
                transparent: true,
                opacity: 0.8
            });
            const sphere = new THREE.Mesh(geometry, material);
            sphere.position.set(x, y, z);
            this.scene.add(sphere);
            
            categoryPositions[category] = { x, y, z };
            this.categoryCenters[category] = {
                mesh: sphere,
                position: { x, y, z },
                lines: []
            };
            
            // Add category label
            this.createLabel(category, x, y + 2, z);
        });
        
        // Create transaction spheres orbiting around categories
        this.transactions.forEach((transaction, index) => {
            const catPos = categoryPositions[transaction.category];
            if (!catPos) return;
            
            const orbitRadius = 3 + (Math.abs(transaction.amount) / 500);
            const orbitAngle = (index / this.transactions.length) * Math.PI * 8;
            const speed = 0.001 + (Math.random() * 0.002);
            
            const geometry = new THREE.SphereGeometry(
                0.3 + (Math.abs(transaction.amount) / 3000),
                16,
                16
            );
            
            let color;
            if (transaction.type === 'income') {
                color = 0x64ff64;
            } else if (transaction.type === 'expense') {
                color = 0x6464ff;
            } else {
                color = 0x64ff64;
            }
            
            const material = new THREE.MeshPhongMaterial({
                color: color,
                emissive: color,
                emissiveIntensity: 0.3,
                transparent: true,
                opacity: 0.9
            });
            
            const sphere = new THREE.Mesh(geometry, material);
            
            // Initial position
            const x = catPos.x + Math.cos(orbitAngle) * orbitRadius;
            const z = catPos.z + Math.sin(orbitAngle) * orbitRadius;
            sphere.position.set(x, catPos.y, z);
            
            sphere.userData = {
                transaction: transaction,
                orbitRadius: orbitRadius,
                orbitAngle: orbitAngle,
                speed: speed,
                center: catPos,
                type: 'orbiting'
            };
            
            this.scene.add(sphere);
            this.transactionMeshes.push(sphere);
            
            // Create trail line
            const trailGeometry = new THREE.BufferGeometry();
            const trailPoints = [];
            for (let i = 0; i < 20; i++) {
                const trailAngle = orbitAngle - (i * 0.1);
                trailPoints.push(
                    catPos.x + Math.cos(trailAngle) * orbitRadius,
                    catPos.y,
                    catPos.z + Math.sin(trailAngle) * orbitRadius
                );
            }
            trailGeometry.setAttribute('position', new THREE.Float32BufferAttribute(trailPoints, 3));
            const trailMaterial = new THREE.LineBasicMaterial({
                color: color,
                transparent: true,
                opacity: 0.3
            });
            const trail = new THREE.Line(trailGeometry, trailMaterial);
            trail.userData = { type: 'trail', parent: sphere };
            this.scene.add(trail);
            this.transactionMeshes.push(trail);
        });
    }
    
    createTimelineView() {
        const sortedTransactions = [...this.transactions].sort((a, b) => a.date - b.date);
        const timeSpan = 365 * 24 * 60 * 60 * 1000; // 1 year in ms
        const earliestDate = sortedTransactions[0].date.getTime();
        
        sortedTransactions.forEach((transaction, index) => {
            const timeProgress = (transaction.date.getTime() - earliestDate) / timeSpan;
            const x = (timeProgress - 0.5) * 80;
            const y = transaction.amount / 100;
            const z = (Math.random() - 0.5) * 20;
            
            const geometry = new THREE.BoxGeometry(0.5, Math.abs(y) * 0.5 + 0.5, 0.5);
            const material = new THREE.MeshPhongMaterial({
                color: transaction.color,
                transparent: true,
                opacity: 0.8
            });
            
            const box = new THREE.Mesh(geometry, material);
            box.position.set(x, y, z);
            box.userData = { transaction: transaction, type: 'static' };
            
            this.scene.add(box);
            this.transactionMeshes.push(box);
        });
        
        // Add timeline axis
        const axisGeometry = new THREE.BufferGeometry();
        const axisPoints = [
            -40, 0, 0,
            40, 0, 0
        ];
        axisGeometry.setAttribute('position', new THREE.Float32BufferAttribute(axisPoints, 3));
        const axisMaterial = new THREE.LineBasicMaterial({ color: 0x64c8ff });
        const axis = new THREE.Line(axisGeometry, axisMaterial);
        this.scene.add(axis);
        this.transactionMeshes.push(axis);
    }
    
    createNetworkView() {
        // Create nodes for categories and transactions
        const categoryNodes = {};
        
        Object.keys(this.categories).forEach((category, index) => {
            const angle = (index / Object.keys(this.categories).length) * Math.PI * 2;
            const radius = 30;
            const x = Math.cos(angle) * radius;
            const z = Math.sin(angle) * radius;
            
            const geometry = new THREE.SphereGeometry(2, 32, 32);
            const material = new THREE.MeshPhongMaterial({
                color: this.transactions.find(t => t.category === category).color,
                emissive: this.transactions.find(t => t.category === category).color,
                emissiveIntensity: 0.5
            });
            
            const node = new THREE.Mesh(geometry, material);
            node.position.set(x, 0, z);
            node.userData = { category: category, type: 'category' };
            
            this.scene.add(node);
            this.transactionMeshes.push(node);
            categoryNodes[category] = node;
            
            // Label
            this.createLabel(category, x, 3, z);
        });
        
        // Create connections between related categories based on transaction patterns
        const categoryList = Object.keys(this.categories);
        for (let i = 0; i < categoryList.length; i++) {
            for (let j = i + 1; j < categoryList.length; j++) {
                if (Math.random() > 0.7) {
                    const cat1 = categoryList[i];
                    const cat2 = categoryList[j];
                    
                    const lineGeometry = new THREE.BufferGeometry();
                    const points = [
                        categoryNodes[cat1].position,
                        categoryNodes[cat2].position
                    ];
                    lineGeometry.setFromPoints(points);
                    
                    const lineMaterial = new THREE.LineBasicMaterial({
                        color: 0x64c8ff,
                        transparent: true,
                        opacity: 0.3
                    });
                    
                    const line = new THREE.Line(lineGeometry, lineMaterial);
                    this.scene.add(line);
                    this.transactionMeshes.push(line);
                }
            }
        }
        
        // Add transaction nodes connected to categories
        this.transactions.forEach((transaction, index) => {
            if (Math.random() > 0.3) return; // Show only some transactions to avoid clutter
            
            const catNode = categoryNodes[transaction.category];
            if (!catNode) return;
            
            const distance = 5 + Math.random() * 10;
            const angle = Math.random() * Math.PI * 2;
            const x = catNode.position.x + Math.cos(angle) * distance;
            const z = catNode.position.z + Math.sin(angle) * distance;
            const y = Math.random() * 10 - 5;
            
            const geometry = new THREE.SphereGeometry(0.5, 16, 16);
            const material = new THREE.MeshPhongMaterial({
                color: transaction.type === 'income' ? 0x64ff64 : 
                       transaction.type === 'expense' ? 0x6464ff : 0x64ff64,
                transparent: true,
                opacity: 0.8
            });
            
            const node = new THREE.Mesh(geometry, material);
            node.position.set(x, y, z);
            node.userData = { transaction: transaction, type: 'transaction' };
            
            this.scene.add(node);
            this.transactionMeshes.push(node);
            
            // Connection line to category
            const lineGeometry = new THREE.BufferGeometry();
            const points = [catNode.position, node.position];
            lineGeometry.setFromPoints(points);
            
            const lineMaterial = new THREE.LineBasicMaterial({
                color: transaction.color,
                transparent: true,
                opacity: 0.2
            });
            
            const line = new THREE.Line(lineGeometry, lineMaterial);
            this.scene.add(line);
            this.transactionMeshes.push(line);
        });
    }
    
    createScatterView() {
        this.transactions.forEach((transaction, index) => {
            const x = (Math.random() - 0.5) * 60;
            const y = transaction.amount / 50;
            const z = (Math.random() - 0.5) * 60;
            
            const geometry = new THREE.IcosahedronGeometry(0.4, 0);
            const material = new THREE.MeshPhongMaterial({
                color: transaction.color,
                transparent: true,
                opacity: 0.9,
                shininess: 100
            });
            
            const sphere = new THREE.Mesh(geometry, material);
            sphere.position.set(x, y, z);
            sphere.userData = { transaction: transaction, type: 'static' };
            
            this.scene.add(sphere);
            this.transactionMeshes.push(sphere);
        });
        
        // Add grid
        const gridHelper = new THREE.GridHelper(60, 20, 0x333366, 0x222244);
        gridHelper.position.y = -10;
        this.scene.add(gridHelper);
        this.transactionMeshes.push(gridHelper);
    }
    
    createLabel(text, x, y, z) {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 256;
        canvas.height = 64;
        
        context.fillStyle = 'rgba(0, 0, 0, 0)';
        context.fillRect(0, 0, canvas.width, canvas.height);
        
        context.font = 'Bold 24px Segoe UI';
        context.fillStyle = 'white';
        context.textAlign = 'center';
        context.fillText(text, canvas.width / 2, canvas.height / 2);
        
        const texture = new THREE.CanvasTexture(canvas);
        const material = new THREE.SpriteMaterial({ map: texture, transparent: true });
        const sprite = new THREE.Sprite(material);
        sprite.position.set(x, y, z);
        sprite.scale.set(8, 2, 1);
        
        this.scene.add(sprite);
        this.transactionMeshes.push(sprite);
    }
    
    updateStats() {
        document.getElementById('total-transactions').textContent = this.transactions.length;
        
        const totalVolume = this.transactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);
        document.getElementById('total-volume').textContent = `$${totalVolume.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
        
        document.getElementById('total-categories').textContent = Object.keys(this.categories).length;
    }
    
    setupEventListeners() {
        // Raycaster for hover effects
        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();
        
        this.renderer.domElement.addEventListener('mousemove', (event) => {
            mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
            
            raycaster.setFromCamera(mouse, this.camera);
            const intersects = raycaster.intersectObjects(this.transactionMeshes);
            
            if (intersects.length > 0) {
                const object = intersects[0].object;
                if (object.userData.transaction) {
                    this.showTooltip(object.userData.transaction, event.clientX, event.clientY);
                    document.body.style.cursor = 'pointer';
                } else {
                    this.hideTooltip();
                    document.body.style.cursor = 'default';
                }
            } else {
                this.hideTooltip();
                document.body.style.cursor = 'default';
            }
        });
        
        // View switcher buttons
        document.querySelectorAll('.control-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.control-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentView = btn.dataset.view;
                this.createVisualization();
            });
        });
    }
    
    showTooltip(transaction, x, y) {
        const amountClass = transaction.amount >= 0 ? 'positive' : 'negative';
        const amountSign = transaction.amount >= 0 ? '+' : '';
        
        this.tooltip.innerHTML = `
            <h3>${transaction.description}</h3>
            <div class="amount ${amountClass}">${amountSign}$${Math.abs(transaction.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            <div><strong>Category:</strong> ${transaction.category}</div>
            <div><strong>Date:</strong> ${transaction.date.toLocaleDateString()}</div>
            <div><strong>Type:</strong> ${transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}</div>
        `;
        
        this.tooltip.style.left = (x + 15) + 'px';
        this.tooltip.style.top = (y + 15) + 'px';
        this.tooltip.style.opacity = '1';
    }
    
    hideTooltip() {
        this.tooltip.style.opacity = '0';
    }
    
    animate() {
        this.animationId = requestAnimationFrame(() => this.animate());
        
        // Animate orbiting transactions in galaxy view
        if (this.currentView === 'galaxy') {
            this.transactionMeshes.forEach(mesh => {
                if (mesh.userData.type === 'orbiting') {
                    mesh.userData.orbitAngle += mesh.userData.speed;
                    const center = mesh.userData.center;
                    const radius = mesh.userData.orbitRadius;
                    
                    mesh.position.x = center.x + Math.cos(mesh.userData.orbitAngle) * radius;
                    mesh.position.z = center.z + Math.sin(mesh.userData.orbitAngle) * radius;
                }
                
                if (mesh.userData.type === 'trail' && mesh.userData.parent) {
                    const parent = mesh.userData.parent;
                    const positions = mesh.geometry.attributes.position.array;
                    
                    // Shift positions
                    for (let i = positions.length - 3; i >= 3; i -= 3) {
                        positions[i] = positions[i - 3];
                        positions[i + 1] = positions[i + 1];
                        positions[i + 2] = positions[i + 2];
                    }
                    
                    // Update first point to parent position
                    positions[0] = parent.position.x;
                    positions[1] = parent.position.y;
                    positions[2] = parent.position.z;
                    
                    mesh.geometry.attributes.position.needsUpdate = true;
                }
            });
        }
        
        // Rotate category centers slightly
        Object.values(this.categoryCenters).forEach(center => {
            center.mesh.rotation.y += 0.01;
            center.mesh.rotation.x += 0.005;
        });
        
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }
    
    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
}

// Initialize the visualizer when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new TransactionVisualizer();
});
