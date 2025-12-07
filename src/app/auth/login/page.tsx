"use client"

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signIn, getSession } from 'next-auth/react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Mail, Lock, LogIn, Eye, EyeOff, AlertCircle, Smartphone } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mfaCode, setMfaCode] = useState('')
  const [showMfaInput, setShowMfaInput] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  React.useEffect(() => {
    // Check if user is already logged in
    getSession().then(session => {
      if (session) {
        router.push('/')
      }
    })
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const result = await signIn('credentials', {
        email,
        password,
        mfaCode: showMfaInput ? mfaCode : undefined,
        redirect: false
      })

      if (result?.error) {
        if (result.error === 'MFA_REQUIRED') {
          setShowMfaInput(true)
          setError('')
        } else if (result.error === 'MFA_INVALID') {
          setError('Código MFA incorreto')
        } else {
          setError('Email ou senha incorretos')
        }
      } else if (result?.ok) {
        router.push('/')
        router.refresh()
      }
    } catch (error) {
      setError('Erro ao fazer login. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-primary rounded-lg flex items-center justify-center mb-4">
            <span className="text-primary-foreground font-bold text-lg">V</span>
          </div>
          <h2 className="text-3xl font-bold text-foreground">Vo.AI</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Sistema de Gestão para Agências de Viagens
          </p>
        </div>

        {/* Login Form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-center">
              {showMfaInput ? 'Autenticação de Dois Fatores' : 'Entrar na sua conta'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {showMfaInput ? (
                <div className="space-y-4">
                  <div className="text-center text-sm text-muted-foreground mb-4">
                    Digite o código de 6 dígitos do seu aplicativo autenticador.
                  </div>
                  <div>
                    <Label htmlFor="mfaCode">Código de Verificação</Label>
                    <div className="relative">
                      <Smartphone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                      <Input
                        id="mfaCode"
                        type="text"
                        value={mfaCode}
                        onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        placeholder="000000"
                        className="pl-10 text-center text-lg tracking-widest"
                        required
                        autoFocus
                        maxLength={6}
                      />
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="link"
                    className="w-full text-sm"
                    onClick={() => setShowMfaInput(false)}
                  >
                    Voltar para login
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="seu@email.com"
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="password">Senha</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="•••••••••"
                        className="pl-10 pr-10"
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-1/2 transform -translate-y-1/2 h-full w-10"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground"></div>
                    Verificando...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <LogIn className="h-4 w-4" />
                    {showMfaInput ? 'Verificar' : 'Entrar'}
                  </div>
                )}
              </Button>
            </form>

            {!showMfaInput && (
              <div className="mt-6 space-y-4 text-center">
                <p className="text-sm text-muted-foreground">
                  Não tem uma conta?{' '}
                  <Link href="/auth/register" className="text-primary hover:text-primary/80 font-medium">
                    Criar conta
                  </Link>
                </p>
                <p className="text-sm text-muted-foreground">
                  <Link href="/auth/reset-password" className="text-primary hover:text-primary/80">
                    Esqueceu sua senha?
                  </Link>
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Vo.AI. Todos os direitos reservados.</p>
        </div>
      </div>
    </div>
  )
}
