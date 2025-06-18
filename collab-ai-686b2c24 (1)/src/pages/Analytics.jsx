import React, { useState, useEffect } from "react";
import { Message, Conversation } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { MessageSquare, Clock, Zap, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";

const COLORS = ['#8E4EFF', '#4ECFFF', '#FF6B6B', '#4ECDC4', '#45B7D1'];

export default function AnalyticsPage() {
  const [messages, setMessages] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [messagesData, conversationsData] = await Promise.all([
      Message.list("-created_date"),
      Conversation.list("-created_date")
    ]);
    setMessages(messagesData);
    setConversations(conversationsData);
    setIsLoading(false);
  };

  const getModelUsageStats = () => {
    const aiMessages = messages.filter(m => m.role === "ai");
    const modelCounts = {};
    aiMessages.forEach(message => {
      const model = message.ai_model || "Unknown";
      modelCounts[model] = (modelCounts[model] || 0) + 1;
    });
    
    return Object.entries(modelCounts).map(([model, count]) => ({
      name: model === "gpt-4" ? "GPT-4" : model === "claude-3" ? "Claude 3" : model === "gemini-pro" ? "Gemini Pro" : model,
      value: count,
      percentage: ((count / aiMessages.length) * 100).toFixed(1)
    }));
  };

  const getResponseTimeStats = () => {
    const aiMessages = messages.filter(m => m.role === "ai" && m.response_time);
    const modelTimes = {};
    
    aiMessages.forEach(message => {
      const model = message.ai_model || "Unknown";
      if (!modelTimes[model]) {
        modelTimes[model] = [];
      }
      modelTimes[model].push(message.response_time);
    });

    return Object.entries(modelTimes).map(([model, times]) => ({
      model: model === "gpt-4" ? "GPT-4" : model === "claude-3" ? "Claude 3" : model === "gemini-pro" ? "Gemini Pro" : model,
      avgTime: Math.round(times.reduce((a, b) => a + b, 0) / times.length),
      minTime: Math.min(...times),
      maxTime: Math.max(...times)
    }));
  };

  const getDailyActivity = () => {
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayMessages = messages.filter(m => 
        m.created_date && m.created_date.startsWith(dateStr)
      );
      
      last7Days.push({
        date: date.toLocaleDateString('en-US', { weekday: 'short' }),
        messages: dayMessages.length,
        conversations: conversations.filter(c => 
          c.created_date && c.created_date.startsWith(dateStr)
        ).length
      });
    }
    return last7Days;
  };

  const modelUsage = getModelUsageStats();
  const responseTimeStats = getResponseTimeStats();
  const dailyActivity = getDailyActivity();

  const totalMessages = messages.length;
  const aiMessages = messages.filter(m => m.role === "ai").length;
  const avgResponseTime = responseTimeStats.length > 0 
    ? Math.round(responseTimeStats.reduce((sum, stat) => sum + stat.avgTime, 0) / responseTimeStats.length)
    : 0;

  if (isLoading) {
    return (
      <div className="p-8 bg-gradient-to-br from-slate-950 via-purple-950/10 to-slate-950 min-h-screen">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-white/10 rounded w-64"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-white/5 rounded-xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 bg-gradient-to-br from-slate-950 via-purple-950/10 to-slate-950 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Analytics Dashboard</h1>
          <p className="text-gray-400">Insights into your AI collaboration patterns</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="glass-effect border-white/10">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">Total Messages</CardTitle>
                <MessageSquare className="h-4 w-4 text-purple-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{totalMessages}</div>
                <p className="text-xs text-gray-400 mt-1">
                  {aiMessages} AI responses
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="glass-effect border-white/10">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">Conversations</CardTitle>
                <TrendingUp className="h-4 w-4 text-blue-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{conversations.length}</div>
                <p className="text-xs text-gray-400 mt-1">
                  Active discussions
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="glass-effect border-white/10">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">Avg Response Time</CardTitle>
                <Clock className="h-4 w-4 text-green-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{avgResponseTime}ms</div>
                <p className="text-xs text-gray-400 mt-1">
                  Across all models
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="glass-effect border-white/10">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">Active Models</CardTitle>
                <Zap className="h-4 w-4 text-orange-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{modelUsage.length}</div>
                <p className="text-xs text-gray-400 mt-1">
                  AI models used
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card className="glass-effect border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Model Usage Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={modelUsage}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percentage }) => `${name} ${percentage}%`}
                    >
                      {modelUsage.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Card className="glass-effect border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Response Time Comparison</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={responseTimeStats}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
                    <XAxis dataKey="model" stroke="#ffffff60" />
                    <YAxis stroke="#ffffff60" />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'rgba(0,0,0,0.8)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '8px',
                        color: 'white'
                      }}
                    />
                    <Bar dataKey="avgTime" fill="#8E4EFF" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <Card className="glass-effect border-white/10">
            <CardHeader>
              <CardTitle className="text-white">Daily Activity (Last 7 Days)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={dailyActivity}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
                  <XAxis dataKey="date" stroke="#ffffff60" />
                  <YAxis stroke="#ffffff60" />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'rgba(0,0,0,0.8)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '8px',
                      color: 'white'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="messages" 
                    stroke="#8E4EFF" 
                    strokeWidth={3}
                    dot={{ fill: '#8E4EFF', strokeWidth: 2, r: 4 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="conversations" 
                    stroke="#4ECFFF" 
                    strokeWidth={3}
                    dot={{ fill: '#4ECFFF', strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}