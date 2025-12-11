"use client"

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  LayoutDashboard,
  Users,
  MessageSquare,
  Map,
  FileText,
  Settings,
  Plus,
  CheckSquare,
  Inbox,
  LogOut,
  Plug
} from 'lucide-react'


const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'CRM Pipeline', href: '/crm', icon: Users },
  { name: 'Tabela de Leads', href: '/leads', icon: FileText },
  { name: 'Chat Hub', href: '/chat', icon: MessageSquare, badge: '3' },
  { name: 'Inbox', href: '/inbox', icon: Inbox },
  { name: 'Roteiros', href: '/roteiros', icon: Map },
  { name: 'Propostas', href: '/propostas', icon: FileText },
  { name: 'Tarefas', href: '/tarefas', icon: CheckSquare },
]

const secondaryNavigation = [
  { name: 'Integrações', href: '/settings/integrations', icon: Plug },
  { name: 'Segurança', href: '/settings/security', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/auth/login' })
  }

  const getUserInitials = (name?: string | null) => {
    if (!name) return 'U'
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  const getUserName = () => {
    return session?.user?.name || 'Usuário'
  }

  const getUserRole = () => {
    const roleMap: Record<string, string> = {
      admin: 'Administrador',
      manager: 'Gerente',
      consultant: 'Consultor'
    }
    return roleMap[session?.user?.role || 'consultant'] || 'Consultor'
  }

  return (
    <div className="flex flex-col h-full bg-sidebar border-r border-sidebar-border">
      {/* Logo */}
      <div className="flex items-center gap-3 p-6 border-b border-sidebar-border">
        <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
          <span className="text-primary-foreground font-bold text-xl">V</span>
        </div>
        <div>
          <h1 className="text-lg font-bold tracking-tight">Vo.AI</h1>
          <p className="text-xs text-secondary font-medium">
            {session?.user?.company || 'Sistema de Gestão'}
          </p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="p-4">
        <Button asChild className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground shadow-lg shadow-primary/20" size="sm">
          <Link href="/crm">
            <Plus className="w-4 h-4 mr-2" />
            Novo Lead
          </Link>
        </Button>
      </div>

      {/* Main Navigation - Scrollable area */}
      <nav className="flex-1 px-4 pb-4 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center justify-between px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200',
                isActive
                  ? 'bg-primary/10 text-primary border border-primary/20'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground'
              )}
            >
              <div className="flex items-center gap-3">
                <item.icon className="w-4 h-4" />
                {item.name}
              </div>
              {item.badge && (
                <Badge variant="secondary" className="bg-destructive/10 text-destructive text-xs border-destructive/20">
                  {item.badge}
                </Badge>
              )}
            </Link>
          )
        })}
      </nav>

      <Separator className="bg-sidebar-border" />

      {/* Secondary Navigation */}
      <nav className="px-4 py-4 space-y-1">
        {secondaryNavigation.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-sidebar-foreground/70 rounded-lg hover:bg-sidebar-accent hover:text-sidebar-foreground transition-all duration-200"
          >
            <item.icon className="w-4 h-4" />
            {item.name}
          </Link>
        ))}
      </nav>

      {/* User Info */}
      <div className="flex-shrink-0 p-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-secondary to-secondary/80 rounded-xl flex items-center justify-center shadow-lg shadow-secondary/20">
            <span className="text-secondary-foreground text-sm font-bold">
              {getUserInitials(session?.user?.name)}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">
              {getUserName()}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {getUserRole()}
            </p>
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleSignOut}
          className="w-full mt-2 text-destructive hover:text-destructive hover:bg-destructive/10"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sair
        </Button>
      </div>

      {/* IntelliX.AI Footer */}
      <div className="flex-shrink-0 p-4 border-t border-sidebar-border">
        <div className="flex flex-col items-center gap-2">
          <Image
            src="/intellix-logo.png"
            alt="IntelliX.AI"
            width={80}
            height={40}
            className="opacity-80"
          />
          <div className="text-xs text-muted-foreground">
            Desenvolvido por <span className="font-semibold"><span className="text-secondary">IntelliX</span><span className="text-primary">.AI</span></span>
          </div>
        </div>
      </div>
    </div>
  )
}
