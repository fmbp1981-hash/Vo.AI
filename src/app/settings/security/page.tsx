"use client"

import React, { useState } from 'react'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Shield, Lock, Smartphone, AlertTriangle } from 'lucide-react'
import { MFASetupWizard } from '@/components/auth/mfa-setup-wizard'
import { toast } from 'sonner'
import { useSession } from 'next-auth/react'

export default function SecuritySettingsPage() {
    const { data: session } = useSession()
    const [showMFAWizard, setShowMFAWizard] = useState(false)
    const [loading, setLoading] = useState(false)

    const [showChangePassword, setShowChangePassword] = useState(false)
    const [currentPassword, setCurrentPassword] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [passwordLoading, setPasswordLoading] = useState(false)

    // This is a simplified check. In a real app, you'd fetch the MFA status from an API
    // because the session might be stale or not contain the mfaEnabled flag if you didn't add it to the session type
    // For now, let's assume we can fetch it or rely on a custom hook.
    // Since we don't have a dedicated "get user profile" API yet that returns mfaEnabled, 
    // we'll rely on the user manually refreshing or re-logging in, OR we can implement a quick check.

    // Let's assume we implement a quick check or just toggle local state for now after success.
    const [isMFAEnabled, setIsMFAEnabled] = useState(false)

    // Effect to check MFA status on load (mock implementation for now, would fetch from API)
    React.useEffect(() => {
        // TODO: Fetch real MFA status
        // fetch('/api/auth/me').then(...)
    }, [])

    const handleDisableMFA = async () => {
        if (!confirm('Tem certeza que deseja desativar a autenticação de dois fatores? Sua conta ficará menos segura.')) {
            return
        }

        setLoading(true)
        try {
            const response = await fetch('/api/auth/mfa/disable', { method: 'POST' })
            const result = await response.json()

            if (result.success) {
                setIsMFAEnabled(false)
                toast.success('MFA desativado com sucesso')
            } else {
                toast.error('Erro ao desativar MFA')
            }
        } catch (error) {
            console.error(error)
            toast.error('Erro de conexão')
        } finally {
            setLoading(false)
        }
    }

    const handleChangePassword = async () => {
        if (!currentPassword) {
            toast.error('Informe sua senha atual')
            return
        }
        if (newPassword.length < 8) {
            toast.error('A nova senha deve ter pelo menos 8 caracteres')
            return
        }
        if (newPassword !== confirmPassword) {
            toast.error('As senhas não coincidem')
            return
        }

        setPasswordLoading(true)
        try {
            const response = await fetch('/api/auth/change-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ currentPassword, newPassword }),
            })

            const result = await response.json().catch(() => ({}))
            if (!response.ok) {
                toast.error(result?.error || 'Erro ao alterar senha')
                return
            }

            toast.success('Senha alterada com sucesso')
            setShowChangePassword(false)
            setCurrentPassword('')
            setNewPassword('')
            setConfirmPassword('')
        } catch (error) {
            console.error(error)
            toast.error('Erro de conexão')
        } finally {
            setPasswordLoading(false)
        }
    }

    return (
        <div className="flex h-screen bg-background">
            <aside className="w-64 flex-shrink-0 border-r border-border">
                <Sidebar />
            </aside>

            <div className="flex-1 flex flex-col overflow-hidden">
                <Header />

                <main className="flex-1 overflow-y-auto p-8">
                    <div className="max-w-4xl mx-auto space-y-8">
                        <div className="space-y-1">
                            <h1 className="text-3xl font-bold tracking-tight">Segurança</h1>
                            <p className="text-muted-foreground">
                                Gerencie suas configurações de segurança e autenticação
                            </p>
                        </div>

                        {/* Password Section */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Lock className="w-5 h-5 text-gray-500" />
                                    Senha
                                </CardTitle>
                                <CardDescription>
                                    Altere sua senha de acesso ao sistema
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center justify-between">
                                    <div className="space-y-1">
                                        <p className="font-medium">Senha atual</p>
                                        <p className="text-sm text-muted-foreground">********</p>
                                    </div>
                                    <Button variant="outline" onClick={() => setShowChangePassword(true)}>
                                        Alterar Senha
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        <Dialog open={showChangePassword} onOpenChange={setShowChangePassword}>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Alterar senha</DialogTitle>
                                    <DialogDescription>
                                        Defina uma nova senha para sua conta.
                                    </DialogDescription>
                                </DialogHeader>

                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="currentPassword">Senha atual</Label>
                                        <Input
                                            id="currentPassword"
                                            type="password"
                                            value={currentPassword}
                                            onChange={(e) => setCurrentPassword(e.target.value)}
                                            placeholder="••••••••"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="newPassword">Nova senha</Label>
                                        <Input
                                            id="newPassword"
                                            type="password"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            placeholder="••••••••"
                                        />
                                        <p className="text-xs text-muted-foreground">Mínimo de 8 caracteres.</p>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="confirmPassword">Confirmar nova senha</Label>
                                        <Input
                                            id="confirmPassword"
                                            type="password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            placeholder="••••••••"
                                        />
                                    </div>
                                </div>

                                <DialogFooter>
                                    <Button
                                        variant="outline"
                                        onClick={() => setShowChangePassword(false)}
                                        disabled={passwordLoading}
                                    >
                                        Cancelar
                                    </Button>
                                    <Button onClick={handleChangePassword} disabled={passwordLoading}>
                                        {passwordLoading ? 'Salvando...' : 'Salvar'}
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>

                        {/* MFA Section */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Shield className="w-5 h-5 text-blue-600" />
                                    Autenticação de Dois Fatores (MFA)
                                </CardTitle>
                                <CardDescription>
                                    Adicione uma camada extra de segurança à sua conta
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {showMFAWizard ? (
                                    <MFASetupWizard
                                        onComplete={() => {
                                            setShowMFAWizard(false)
                                            setIsMFAEnabled(true)
                                        }}
                                        onCancel={() => setShowMFAWizard(false)}
                                    />
                                ) : (
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-start gap-4">
                                            <div className={`p-2 rounded-full ${isMFAEnabled ? 'bg-green-100' : 'bg-gray-100'}`}>
                                                <Smartphone className={`w-6 h-6 ${isMFAEnabled ? 'text-green-600' : 'text-gray-500'}`} />
                                            </div>
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <p className="font-medium">Status do MFA</p>
                                                    {isMFAEnabled ? (
                                                        <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Ativado</Badge>
                                                    ) : (
                                                        <Badge variant="secondary">Desativado</Badge>
                                                    )}
                                                </div>
                                                <p className="text-sm text-muted-foreground max-w-md">
                                                    {isMFAEnabled
                                                        ? 'Sua conta está protegida com autenticação de dois fatores.'
                                                        : 'Proteja sua conta exigindo um código do seu celular ao fazer login.'}
                                                </p>
                                            </div>
                                        </div>

                                        {isMFAEnabled ? (
                                            <Button
                                                variant="outline"
                                                className="text-destructive border-destructive/30 hover:bg-destructive/10"
                                                onClick={handleDisableMFA}
                                                disabled={loading}
                                            >
                                                Desativar MFA
                                            </Button>
                                        ) : (
                                            <Button onClick={() => setShowMFAWizard(true)}>
                                                Configurar MFA
                                            </Button>
                                        )}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Sessions Section (Placeholder) */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <AlertTriangle className="w-5 h-5 text-orange-500" />
                                    Sessões Ativas
                                </CardTitle>
                                <CardDescription>
                                    Gerencie os dispositivos conectados à sua conta
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="text-sm text-muted-foreground">
                                    Esta funcionalidade estará disponível em breve.
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </main>
            </div>
        </div>
    )
}
