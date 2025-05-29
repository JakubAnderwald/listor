import React, { useState, useEffect } from 'react';
import { LoginForm } from '../components/auth/LoginForm';
import { SignupForm } from '../components/auth/SignupForm';
import { PasswordResetForm } from '../components/auth/PasswordResetForm';
import { useAuth } from '../components/auth/AuthProvider';
import { useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { CheckCircle, ListTodo, Users, Repeat } from 'lucide-react';

type AuthMode = 'login' | 'signup' | 'reset';

export default function AuthPage() {
  const [mode, setMode] = useState<AuthMode>('login');
  const { isAuthenticated, loading } = useAuth();
  const [, setLocation] = useLocation();

  // Auto-redirect if already authenticated
  useEffect(() => {
    if (!loading && isAuthenticated) {
      setLocation('/dashboard');
    }
  }, [isAuthenticated, loading, setLocation]);

  // Show loading while checking auth state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  const renderResetForm = () => (
    <PasswordResetForm onBack={() => setMode('login')} />
  );

  if (mode === 'reset') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          {renderResetForm()}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl w-full flex items-center justify-center gap-12">
        {/* Left side - Branding and Features */}
        <div className="hidden lg:flex flex-1 flex-col justify-center space-y-8 max-w-lg">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
              Welcome to Listor
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              The intelligent todo app that adapts to your productivity style
            </p>
          </div>
          
          <div className="space-y-6">
            <div className="flex items-center space-x-4">
              <div className="bg-blue-600 p-3 rounded-full">
                <ListTodo className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Smart Task Management</h3>
                <p className="text-gray-600 dark:text-gray-300">Organize tasks with priorities, due dates, and subtasks</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="bg-green-600 p-3 rounded-full">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Real-time Collaboration</h3>
                <p className="text-gray-600 dark:text-gray-300">Share lists and collaborate with family or team members</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="bg-purple-600 p-3 rounded-full">
                <Repeat className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Recurring Tasks</h3>
                <p className="text-gray-600 dark:text-gray-300">Automate recurring tasks with flexible patterns</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Authentication Forms */}
        <div className="w-full max-w-md mx-auto lg:mx-0">
          <Card className="border-0 shadow-2xl">
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-2xl font-bold">Get Started</CardTitle>
              <CardDescription>
                Sign in to your account or create a new one
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={mode} onValueChange={(value) => setMode(value as AuthMode)} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="login">Sign In</TabsTrigger>
                  <TabsTrigger value="signup">Sign Up</TabsTrigger>
                </TabsList>
                
                <TabsContent value="login" className="mt-6">
                  <LoginForm
                    onSuccess={() => setLocation('/dashboard')}
                    onSwitchToSignup={() => setMode('signup')}
                    onForgotPassword={() => setMode('reset')}
                  />
                </TabsContent>
                
                <TabsContent value="signup" className="mt-6">
                  <SignupForm
                    onSuccess={() => setLocation('/dashboard')}
                    onSwitchToLogin={() => setMode('login')}
                  />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}