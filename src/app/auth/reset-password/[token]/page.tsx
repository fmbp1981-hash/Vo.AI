"use client"

import React from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, CheckCircle, Lock } from 'lucide-react'

export default function ResetPasswordTokenPage() {
  const params = useParams<{ token: string }>()
  const router = useRouter()

  const token = params?.token

  const [newPassword, setNewPassword] = React.useState('')
  const [confirmPassword, setConfirmPassword] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState('')
  const [done, setDone] = React.useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!token) {
      setError('Token inválido')
      return
    }

    if (newPassword.length < 8) {
      setError('A senha deve ter pelo menos 8 caracteres')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('As senhas não coincidem')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password: newPassword }),
      })

      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        setError(data?.error || 'Não foi possível redefinir a senha')
        return
      }

      setDone(true)
      setTimeout(() => router.push('/auth/login'), 1500)
    } catch (err) {
      setError('Erro ao redefinir a senha')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-primary rounded-lg flex items-center justify-center mb-4">
            <span className="text-primary-foreground font-bold text-lg">V</span>
          </div>
          <h2 className="text-3xl font-bold text-foreground">Criar nova senha</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Defina uma nova senha para sua conta
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-center">Redefinição de senha</CardTitle>
          </CardHeader>
          <CardContent>
            {done ? (
              <div className="text-center py-2 space-y-3">
                <CheckCircle className="h-10 w-10 text-green-500 mx-auto" />
                <p className="text-sm text-muted-foreground">Senha atualizada. Redirecionando…</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="newPassword">Nova senha</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                      <Input
                        id="newPassword"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="pl-10"
                        placeholder="••••••••"
                        required
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Mínimo de 8 caracteres.</p>
                  </div>

                  <div>
                    <Label htmlFor="confirmPassword">Confirmar nova senha</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Salvando...' : 'Salvar nova senha'}
                </Button>

                <div className="text-center text-sm text-muted-foreground">
                  <Link href="/auth/login" className="text-primary hover:text-primary/80">
                    Voltar
                  </Link>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
