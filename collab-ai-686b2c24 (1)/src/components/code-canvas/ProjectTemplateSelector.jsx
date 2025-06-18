import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Search, 
  Code, 
  Globe, 
  Database, 
  Gamepad2, 
  Smartphone, 
  Brain, 
  Briefcase, 
  GraduationCap,
  Clock,
  Target,
  Sparkles,
  ChevronRight,
  Star
} from 'lucide-react';
import { ProjectTemplate } from "@/api/entities";

const CATEGORY_ICONS = {
  web: Globe,
  api: Database,
  data: Database,
  game: Gamepad2,
  mobile: Smartphone,
  ai: Brain,
  business: Briefcase,
  education: GraduationCap
};

const CATEGORY_COLORS = {
  web: 'from-blue-400 to-cyan-500',
  api: 'from-green-400 to-teal-500',
  data: 'from-purple-400 to-indigo-500',
  game: 'from-red-400 to-pink-500',
  mobile: 'from-orange-400 to-yellow-500',
  ai: 'from-violet-400 to-purple-500',
  business: 'from-gray-400 to-slate-500',
  education: 'from-emerald-400 to-green-500'
};

const DIFFICULTY_COLORS = {
  beginner: 'bg-green-500/20 text-green-400 border-green-500/30',
  intermediate: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  advanced: 'bg-red-500/20 text-red-400 border-red-500/30'
};

const BUILT_IN_TEMPLATES = [
  {
    id: 'react-dashboard',
    name: 'React Analytics Dashboard',
    description: 'A modern dashboard with charts, data visualization, and responsive design',
    category: 'web',
    language: 'react',
    difficulty: 'intermediate',
    tags: ['react', 'dashboard', 'charts', 'responsive'],
    estimated_time: '3-4 hours',
    learning_objectives: ['React components', 'Data visualization', 'State management', 'Responsive design'],
    ai_prompts: [
      'Help me add real-time data updates to this dashboard',
      'Suggest improvements for the user interface design',
      'Add more chart types and data analysis features'
    ],
    starter_code: `import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const Dashboard = () => {
  const [data, setData] = useState([
    { name: 'Jan', value: 400 },
    { name: 'Feb', value: 300 },
    { name: 'Mar', value: 600 },
    { name: 'Apr', value: 800 },
    { name: 'May', value: 500 }
  ]);

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Analytics Dashboard</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900">Total Users</h3>
            <p className="text-3xl font-bold text-blue-600">12,847</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900">Revenue</h3>
            <p className="text-3xl font-bold text-green-600">$54,320</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900">Growth</h3>
            <p className="text-3xl font-bold text-purple-600">+23%</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Monthly Performance</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#3B82F6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;`,
    instructions: `This template creates a modern analytics dashboard with:
- Key metrics cards showing important statistics
- Interactive charts using Recharts library
- Responsive grid layout
- Clean, professional styling

Perfect for building business dashboards, admin panels, or data visualization apps.`
  },
  {
    id: 'python-data-analysis',
    name: 'Python Data Analysis Toolkit',
    description: 'Complete data analysis workflow with pandas, visualization, and machine learning',
    category: 'data',
    language: 'python',
    difficulty: 'intermediate',
    tags: ['python', 'pandas', 'data-science', 'ml'],
    estimated_time: '2-3 hours',
    learning_objectives: ['Data manipulation', 'Statistical analysis', 'Data visualization', 'Machine learning basics'],
    ai_prompts: [
      'Help me optimize this data processing pipeline',
      'Suggest additional statistical analyses for this dataset',
      'Add machine learning models for predictive analysis'
    ],
    starter_code: `import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_squared_error, r2_score

class DataAnalyzer:
    def __init__(self, data_file=None):
        self.df = None
        self.model = None
        if data_file:
            self.load_data(data_file)
    
    def load_data(self, file_path):
        """Load data from CSV file"""
        try:
            self.df = pd.read_csv(file_path)
            print(f"Data loaded successfully. Shape: {self.df.shape}")
            return self.df
        except Exception as e:
            print(f"Error loading data: {e}")
    
    def explore_data(self):
        """Basic data exploration"""
        if self.df is None:
            print("No data loaded!")
            return
        
        print("=== DATA OVERVIEW ===")
        print(f"Shape: {self.df.shape}")
        print(f"Columns: {list(self.df.columns)}")
        print("\\n=== DATA TYPES ===")
        print(self.df.dtypes)
        print("\\n=== MISSING VALUES ===")
        print(self.df.isnull().sum())
        print("\\n=== STATISTICAL SUMMARY ===")
        print(self.df.describe())
    
    def visualize_data(self, columns=None):
        """Create visualizations"""
        if self.df is None:
            print("No data loaded!")
            return
        
        if columns is None:
            numeric_columns = self.df.select_dtypes(include=[np.number]).columns
            columns = numeric_columns[:4]  # First 4 numeric columns
        
        fig, axes = plt.subplots(2, 2, figsize=(12, 10))
        fig.suptitle('Data Visualization Dashboard', fontsize=16)
        
        for i, col in enumerate(columns[:4]):
            row, col_idx = i // 2, i % 2
            if col in self.df.columns:
                self.df[col].hist(bins=30, ax=axes[row, col_idx])
                axes[row, col_idx].set_title(f'Distribution of {col}')
                axes[row, col_idx].set_xlabel(col)
                axes[row, col_idx].set_ylabel('Frequency')
        
        plt.tight_layout()
        plt.show()
    
    def correlation_analysis(self):
        """Analyze correlations between numeric variables"""
        if self.df is None:
            print("No data loaded!")
            return
        
        numeric_df = self.df.select_dtypes(include=[np.number])
        correlation_matrix = numeric_df.corr()
        
        plt.figure(figsize=(10, 8))
        sns.heatmap(correlation_matrix, annot=True, cmap='coolwarm', center=0)
        plt.title('Correlation Matrix')
        plt.show()
        
        return correlation_matrix
    
    def train_model(self, target_column, feature_columns=None):
        """Train a simple linear regression model"""
        if self.df is None:
            print("No data loaded!")
            return
        
        if target_column not in self.df.columns:
            print(f"Target column '{target_column}' not found!")
            return
        
        if feature_columns is None:
            feature_columns = self.df.select_dtypes(include=[np.number]).columns.tolist()
            if target_column in feature_columns:
                feature_columns.remove(target_column)
        
        # Prepare data
        X = self.df[feature_columns].dropna()
        y = self.df[target_column].dropna()
        
        # Align X and y indices
        common_idx = X.index.intersection(y.index)
        X = X.loc[common_idx]
        y = y.loc[common_idx]
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
        
        # Train model
        self.model = LinearRegression()
        self.model.fit(X_train, y_train)
        
        # Make predictions
        y_pred = self.model.predict(X_test)
        
        # Evaluate
        mse = mean_squared_error(y_test, y_pred)
        r2 = r2_score(y_test, y_pred)
        
        print(f"Model Performance:")
        print(f"Mean Squared Error: {mse:.4f}")
        print(f"R² Score: {r2:.4f}")
        
        return self.model

# Example usage:
# analyzer = DataAnalyzer()
# analyzer.load_data('your_data.csv')
# analyzer.explore_data()
# analyzer.visualize_data()
# analyzer.correlation_analysis()
# analyzer.train_model('target_column')`,
    instructions: `This toolkit provides a complete data analysis workflow:
- Data loading and exploration
- Statistical summaries and missing value analysis
- Automated visualizations and correlation analysis
- Simple machine learning model training

Perfect for data science projects, research analysis, or business intelligence tasks.`
  },
  {
    id: 'game-engine',
    name: 'JavaScript Game Engine',
    description: 'A lightweight 2D game engine with sprite animation, collision detection, and game loop',
    category: 'game',
    language: 'javascript',
    difficulty: 'advanced',
    tags: ['javascript', 'game-dev', 'canvas', 'animation'],
    estimated_time: '4-6 hours',
    learning_objectives: ['Game development concepts', 'Canvas API', 'Object-oriented programming', 'Animation systems'],
    ai_prompts: [
      'Help me add sound effects and background music',
      'Implement a particle system for special effects',
      'Add more game mechanics like power-ups and enemies'
    ],
    starter_code: `class GameEngine {
  constructor(canvasId, width = 800, height = 600) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.canvas.width = width;
    this.canvas.height = height;
    
    this.entities = [];
    this.running = false;
    this.lastTime = 0;
    this.keys = {};
    
    this.setupEventListeners();
  }
  
  setupEventListeners() {
    window.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;
    });
    
    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });
  }
  
  addEntity(entity) {
    this.entities.push(entity);
  }
  
  removeEntity(entity) {
    const index = this.entities.indexOf(entity);
    if (index > -1) {
      this.entities.splice(index, 1);
    }
  }
  
  start() {
    this.running = true;
    this.gameLoop();
  }
  
  stop() {
    this.running = false;
  }
  
  gameLoop(currentTime = 0) {
    if (!this.running) return;
    
    const deltaTime = currentTime - this.lastTime;
    this.lastTime = currentTime;
    
    this.update(deltaTime);
    this.render();
    
    requestAnimationFrame((time) => this.gameLoop(time));
  }
  
  update(deltaTime) {
    this.entities.forEach(entity => {
      if (entity.update) {
        entity.update(deltaTime, this);
      }
    });
    
    this.checkCollisions();
  }
  
  render() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.entities.forEach(entity => {
      if (entity.render) {
        entity.render(this.ctx);
      }
    });
  }
  
  checkCollisions() {
    for (let i = 0; i < this.entities.length; i++) {
      for (let j = i + 1; j < this.entities.length; j++) {
        const entityA = this.entities[i];
        const entityB = this.entities[j];
        
        if (this.isColliding(entityA, entityB)) {
          if (entityA.onCollision) entityA.onCollision(entityB);
          if (entityB.onCollision) entityB.onCollision(entityA);
        }
      }
    }
  }
  
  isColliding(a, b) {
    return a.x < b.x + b.width &&
           a.x + a.width > b.x &&
           a.y < b.y + b.height &&
           a.y + a.height > b.y;
  }
}

class Sprite {
  constructor(x, y, width, height, color = 'blue') {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.color = color;
    this.vx = 0;
    this.vy = 0;
  }
  
  update(deltaTime, game) {
    this.x += this.vx * deltaTime * 0.1;
    this.y += this.vy * deltaTime * 0.1;
    
    // Keep within bounds
    if (this.x < 0) this.x = 0;
    if (this.x + this.width > game.canvas.width) this.x = game.canvas.width - this.width;
    if (this.y < 0) this.y = 0;
    if (this.y + this.height > game.canvas.height) this.y = game.canvas.height - this.height;
  }
  
  render(ctx) {
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x, this.y, this.width, this.height);
  }
}

class Player extends Sprite {
  constructor(x, y) {
    super(x, y, 50, 50, 'green');
    this.speed = 200;
  }
  
  update(deltaTime, game) {
    this.vx = 0;
    this.vy = 0;
    
    if (game.keys['ArrowLeft']) this.vx = -this.speed;
    if (game.keys['ArrowRight']) this.vx = this.speed;
    if (game.keys['ArrowUp']) this.vy = -this.speed;
    if (game.keys['ArrowDown']) this.vy = this.speed;
    
    super.update(deltaTime, game);
  }
  
  onCollision(other) {
    if (other instanceof Enemy) {
      console.log('Player hit enemy!');
    }
  }
}

class Enemy extends Sprite {
  constructor(x, y) {
    super(x, y, 30, 30, 'red');
    this.speed = 100;
    this.direction = Math.random() * Math.PI * 2;
  }
  
  update(deltaTime, game) {
    this.vx = Math.cos(this.direction) * this.speed;
    this.vy = Math.sin(this.direction) * this.speed;
    
    // Bounce off walls
    if (this.x <= 0 || this.x + this.width >= game.canvas.width) {
      this.direction = Math.PI - this.direction;
    }
    if (this.y <= 0 || this.y + this.height >= game.canvas.height) {
      this.direction = -this.direction;
    }
    
    super.update(deltaTime, game);
  }
}

// Usage example:
// Create HTML: <canvas id="gameCanvas"></canvas>
// const game = new GameEngine('gameCanvas');
// const player = new Player(400, 300);
// const enemy1 = new Enemy(100, 100);
// const enemy2 = new Enemy(600, 400);
// 
// game.addEntity(player);
// game.addEntity(enemy1);
// game.addEntity(enemy2);
// game.start();`,
    instructions: `This game engine includes:
- Complete game loop with delta time
- Entity system for game objects
- Collision detection between sprites
- Keyboard input handling
- Player and Enemy classes with movement

Add a canvas element to your HTML and start building your game!`
  },
  {
    id: 'api-server',
    name: 'Express REST API Server',
    description: 'A complete REST API server with authentication, validation, and database integration',
    category: 'api',
    language: 'javascript',
    difficulty: 'intermediate',
    tags: ['express', 'api', 'auth', 'database'],
    estimated_time: '2-3 hours',
    learning_objectives: ['REST API design', 'Authentication', 'Database operations', 'Error handling'],
    ai_prompts: [
      'Help me add more API endpoints for user management',
      'Implement rate limiting and security middleware',
      'Add data validation and sanitization'
    ],
    starter_code: `const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const rateLimit = require('express-rate-limit');

class APIServer {
  constructor(port = 3000) {
    this.app = express();
    this.port = port;
    this.users = []; // In-memory storage (replace with real database)
    this.posts = [];
    
    this.setupMiddleware();
    this.setupRoutes();
  }
  
  setupMiddleware() {
    // Rate limiting
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100 // limit each IP to 100 requests per windowMs
    });
    
    this.app.use(limiter);
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
    
    // CORS
    this.app.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      next();
    });
  }
  
  setupRoutes() {
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({ status: 'OK', timestamp: new Date().toISOString() });
    });
    
    // Auth routes
    this.app.post('/api/register', this.register.bind(this));
    this.app.post('/api/login', this.login.bind(this));
    
    // Protected routes
    this.app.get('/api/profile', this.authenticate.bind(this), this.getProfile.bind(this));
    this.app.get('/api/posts', this.authenticate.bind(this), this.getPosts.bind(this));
    this.app.post('/api/posts', this.authenticate.bind(this), this.createPost.bind(this));
    this.app.put('/api/posts/:id', this.authenticate.bind(this), this.updatePost.bind(this));
    this.app.delete('/api/posts/:id', this.authenticate.bind(this), this.deletePost.bind(this));
    
    // Error handling
    this.app.use(this.errorHandler.bind(this));
  }
  
  async register(req, res) {
    try {
      const { username, email, password } = req.body;
      
      // Validation
      if (!username || !email || !password) {
        return res.status(400).json({ error: 'Missing required fields' });
      }
      
      // Check if user exists
      if (this.users.find(u => u.email === email)) {
        return res.status(409).json({ error: 'User already exists' });
      }
      
      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);
      
      // Create user
      const user = {
        id: this.users.length + 1,
        username,
        email,
        password: hashedPassword,
        createdAt: new Date().toISOString()
      };
      
      this.users.push(user);
      
      // Generate token
      const token = jwt.sign(
        { userId: user.id, email: user.email },
        'your-secret-key', // Use environment variable in production
        { expiresIn: '24h' }
      );
      
      res.status(201).json({
        message: 'User created successfully',
        token,
        user: { id: user.id, username: user.username, email: user.email }
      });
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
  
  async login(req, res) {
    try {
      const { email, password } = req.body;
      
      // Find user
      const user = this.users.find(u => u.email === email);
      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      
      // Check password
      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      
      // Generate token
      const token = jwt.sign(
        { userId: user.id, email: user.email },
        'your-secret-key',
        { expiresIn: '24h' }
      );
      
      res.json({
        message: 'Login successful',
        token,
        user: { id: user.id, username: user.username, email: user.email }
      });
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
  
  authenticate(req, res, next) {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }
    
    try {
      const decoded = jwt.verify(token, 'your-secret-key');
      req.user = decoded;
      next();
    } catch (error) {
      res.status(400).json({ error: 'Invalid token' });
    }
  }
  
  getProfile(req, res) {
    const user = this.users.find(u => u.id === req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      createdAt: user.createdAt
    });
  }
  
  getPosts(req, res) {
    const userPosts = this.posts.filter(p => p.userId === req.user.userId);
    res.json(userPosts);
  }
  
  createPost(req, res) {
    const { title, content } = req.body;
    
    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }
    
    const post = {
      id: this.posts.length + 1,
      userId: req.user.userId,
      title,
      content,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    this.posts.push(post);
    res.status(201).json(post);
  }
  
  updatePost(req, res) {
    const postId = parseInt(req.params.id);
    const { title, content } = req.body;
    
    const post = this.posts.find(p => p.id === postId && p.userId === req.user.userId);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    
    if (title) post.title = title;
    if (content) post.content = content;
    post.updatedAt = new Date().toISOString();
    
    res.json(post);
  }
  
  deletePost(req, res) {
    const postId = parseInt(req.params.id);
    const postIndex = this.posts.findIndex(p => p.id === postId && p.userId === req.user.userId);
    
    if (postIndex === -1) {
      return res.status(404).json({ error: 'Post not found' });
    }
    
    this.posts.splice(postIndex, 1);
    res.json({ message: 'Post deleted successfully' });
  }
  
  errorHandler(error, req, res, next) {
    console.error(error.stack);
    res.status(500).json({ error: 'Something went wrong!' });
  }
  
  start() {
    this.app.listen(this.port, () => {
      console.log(\`Server running on port \${this.port}\`);
    });
  }
}

// Usage:
// const server = new APIServer(3000);
// server.start();

module.exports = APIServer;`,
    instructions: `This API server includes:
- JWT authentication with registration and login
- Protected routes with middleware
- CRUD operations for posts
- Rate limiting and CORS
- Error handling and validation

Install dependencies: npm install express jsonwebtoken bcrypt express-rate-limit`
  }
];

export default function ProjectTemplateSelector({ isVisible, onClose, onSelectTemplate }) {
  const [templates, setTemplates] = useState([]);
  const [filteredTemplates, setFilteredTemplates] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  useEffect(() => {
    loadTemplates();
  }, []);

  useEffect(() => {
    filterTemplates();
  }, [templates, searchTerm, selectedCategory, selectedDifficulty]);

  const loadTemplates = async () => {
    try {
      const customTemplates = await ProjectTemplate.list('-created_date');
      const allTemplates = [...BUILT_IN_TEMPLATES, ...customTemplates];
      setTemplates(allTemplates);
    } catch (error) {
      console.log('Using built-in templates only');
      setTemplates(BUILT_IN_TEMPLATES);
    }
  };

  const filterTemplates = () => {
    let filtered = templates;

    if (searchTerm) {
      filtered = filtered.filter(template =>
        template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        template.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(template => template.category === selectedCategory);
    }

    if (selectedDifficulty !== 'all') {
      filtered = filtered.filter(template => template.difficulty === selectedDifficulty);
    }

    setFilteredTemplates(filtered);
  };

  const handleSelectTemplate = (template) => {
    onSelectTemplate({
      title: template.name,
      description: template.description,
      language: template.language,
      code_content: template.starter_code,
      version: 1,
      modification_summary: `Started from ${template.name} template`
    });
    onClose();
  };

  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="glass-effect border border-white/10 rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-purple-400" />
                Project Templates
              </h2>
              <p className="text-gray-400 mt-1">Choose a template to kickstart your AI collaboration</p>
            </div>
            <Button variant="ghost" onClick={onClose} className="text-gray-400 hover:text-white">
              ×
            </Button>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-4">
            <div className="relative flex-1 min-w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search templates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white/5 border-white/10 text-white"
              />
            </div>

            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-40 bg-white/5 border-white/10 text-white">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="web">Web Development</SelectItem>
                <SelectItem value="api">API Development</SelectItem>
                <SelectItem value="data">Data Science</SelectItem>
                <SelectItem value="game">Game Development</SelectItem>
                <SelectItem value="mobile">Mobile Apps</SelectItem>
                <SelectItem value="ai">AI & ML</SelectItem>
                <SelectItem value="business">Business Tools</SelectItem>
                <SelectItem value="education">Educational</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
              <SelectTrigger className="w-32 bg-white/5 border-white/10 text-white">
                <SelectValue placeholder="Difficulty" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="beginner">Beginner</SelectItem>
                <SelectItem value="intermediate">Intermediate</SelectItem>
                <SelectItem value="advanced">Advanced</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Template Grid */}
        <ScrollArea className="flex-1 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence>
              {filteredTemplates.map((template, index) => {
                const IconComponent = CATEGORY_ICONS[template.category] || Code;
                const colorClass = CATEGORY_COLORS[template.category] || 'from-gray-400 to-gray-500';
                
                return (
                  <motion.div
                    key={template.id || index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.05 }}
                    className="glass-effect border border-white/10 rounded-xl p-4 hover:border-white/20 transition-all cursor-pointer group"
                    onClick={() => setSelectedTemplate(template)}
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <div className={`w-10 h-10 bg-gradient-to-br ${colorClass} rounded-lg flex items-center justify-center flex-shrink-0`}>
                        <IconComponent className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-white text-sm group-hover:text-purple-300 transition-colors">
                          {template.name}
                        </h3>
                        <p className="text-xs text-gray-400 mt-1 line-clamp-2">
                          {template.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1 mb-3">
                      <Badge className={`text-xs ${DIFFICULTY_COLORS[template.difficulty]}`}>
                        {template.difficulty}
                      </Badge>
                      <Badge variant="outline" className="text-xs border-white/20 text-gray-300">
                        {template.language}
                      </Badge>
                    </div>

                    {template.estimated_time && (
                      <div className="flex items-center gap-1 text-xs text-gray-400 mb-2">
                        <Clock className="w-3 h-3" />
                        {template.estimated_time}
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="flex flex-wrap gap-1">
                        {template.tags?.slice(0, 2).map(tag => (
                          <Badge key={tag} variant="outline" className="text-xs border-white/10 text-gray-400">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" />
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </ScrollArea>

        {/* Template Details Modal */}
        <AnimatePresence>
          {selectedTemplate && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6"
              onClick={() => setSelectedTemplate(null)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="glass-effect border border-white/10 rounded-xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-6 border-b border-white/10">
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 bg-gradient-to-br ${CATEGORY_COLORS[selectedTemplate.category]} rounded-lg flex items-center justify-center flex-shrink-0`}>
                      {React.createElement(CATEGORY_ICONS[selectedTemplate.category] || Code, { className: "w-6 h-6 text-white" })}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-white">{selectedTemplate.name}</h3>
                      <p className="text-gray-400 mt-1">{selectedTemplate.description}</p>
                    </div>
                  </div>
                </div>

                <ScrollArea className="p-6 max-h-96">
                  <div className="space-y-4">
                    {selectedTemplate.instructions && (
                      <div>
                        <h4 className="font-semibold text-white mb-2">Instructions</h4>
                        <p className="text-gray-300 text-sm whitespace-pre-line">{selectedTemplate.instructions}</p>
                      </div>
                    )}

                    {selectedTemplate.learning_objectives && (
                      <div>
                        <h4 className="font-semibold text-white mb-2 flex items-center gap-2">
                          <Target className="w-4 h-4" />
                          Learning Objectives
                        </h4>
                        <ul className="list-disc list-inside text-gray-300 text-sm space-y-1">
                          {selectedTemplate.learning_objectives.map((objective, index) => (
                            <li key={index}>{objective}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {selectedTemplate.ai_prompts && (
                      <div>
                        <h4 className="font-semibold text-white mb-2 flex items-center gap-2">
                          <Brain className="w-4 h-4" />
                          Suggested AI Prompts
                        </h4>
                        <ul className="space-y-2">
                          {selectedTemplate.ai_prompts.map((prompt, index) => (
                            <li key={index} className="text-gray-300 text-sm bg-white/5 p-2 rounded">
                              "{prompt}"
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </ScrollArea>

                <div className="p-6 border-t border-white/10 flex justify-between">
                  <Button
                    variant="outline"
                    onClick={() => setSelectedTemplate(null)}
                    className="border-white/20 text-white hover:bg-white/10"
                  >
                    Back
                  </Button>
                  <Button
                    onClick={() => handleSelectTemplate(selectedTemplate)}
                    className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
                  >
                    <Star className="w-4 h-4 mr-2" />
                    Use This Template
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}