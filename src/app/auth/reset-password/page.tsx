"use client"

import React from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Mail, AlertCircle, CheckCircle } from 'lucide-react'

export default function ResetPasswordRequestPage() {
  const [email, setEmail] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState('')
  const [sent, setSent] = React.useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      // Always show success (anti-enumeration)
      if (!res.ok) {
        // still show success to the user
      }

      setSent(true)
    } catch (err) {
      setSent(true)
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
          <h2 className="text-3xl font-bold text-foreground">Redefinir senha</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Informe seu e-mail para receber o link
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-center">Esqueci minha senha</CardTitle>
          </CardHeader>
          <CardContent>
            {sent ? (
              <div className="text-center py-2 space-y-3">
                <CheckCircle className="h-10 w-10 text-green-500 mx-auto" />
                <p className="text-sm text-muted-foreground">
                  Se existir uma conta com esse e-mail, enviamos um link para redefinir a senha.
                </p>
                <Button asChild className="w-full">
                  <Link href="/auth/login">Voltar ao login</Link>
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
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

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Enviando...' : 'Enviar link de redefinição'}
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
