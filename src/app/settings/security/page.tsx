"use client"

import React, { useState } from 'react'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Shield, Lock, Smartphone, AlertTriangle } from 'lucide-react'
import { MFASetupWizard } from '@/components/auth/mfa-setup-wizard'
import { toast } from 'sonner'
import { useSession } from 'next-auth/react'

export default function SecuritySettingsPage() {
    const { data: session, update } = useSession()
    const [showMFAWizard, setShowMFAWizard] = useState(false)
    const [loading, setLoading] = useState(false)

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
                                    <Button variant="outline">Alterar Senha</Button>
                                </div>
                            </CardContent>
                        </Card>

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
                                            <Button variant="destructive" variant="outline" onClick={handleDisableMFA} disabled={loading}>
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
