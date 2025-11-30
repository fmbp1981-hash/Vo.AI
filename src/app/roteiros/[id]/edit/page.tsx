"use client"

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { ItineraryVisualEditor } from '@/components/roteiros/itinerary-visual-editor'
import { Card, CardContent } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'

export default function EditItineraryPage() {
    const params = useParams()
    const router = useRouter()
    const [itinerary, setItinerary] = useState<any | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const fetchItinerary = async () => {
            try {
                const response = await fetch(`/api/roteiros/${params.id}`)
                if (!response.ok) {
                    throw new Error('Failed to fetch itinerary')
                }
                const data = await response.json()

                // Parse content if it's a string
                const content = typeof data.content === 'string'
                    ? JSON.parse(data.content)
                    : data.content

                setItinerary(content)
            } catch (err: any) {
                console.error('Error fetching itinerary:', err)
                setError(err.message || 'Erro ao carregar roteiro')
            } finally {
                setLoading(false)
            }
        }

        if (params.id) {
            fetchItinerary()
        }
    }, [params.id])

    const handleSave = async (updatedItinerary: any) => {
        const response = await fetch(`/api/roteiros/${params.id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                content: JSON.stringify(updatedItinerary),
                totalCost: updatedItinerary.totalCost,
            }),
        })

        if (!response.ok) {
            throw new Error('Failed to save itinerary')
        }
    }

    const handleClose = () => {
        router.push('/roteiros')
    }

    return (
        <div className="flex h-screen bg-gray-50">
            <aside className="w-64 flex-shrink-0">
                <Sidebar />
            </aside>

            <div className="flex-1 flex flex-col overflow-hidden">
                <Header />

                <main className="flex-1 overflow-y-auto p-6">
                    {loading && (
                        <Card>
                            <CardContent className="p-12">
                                <div className="text-center space-y-4">
                                    <Loader2 className="w-12 h-12 text-blue-600 mx-auto animate-spin" />
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900">
                                            Carregando roteiro...
                                        </h3>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {error && (
                        <Card>
                            <CardContent className="p-12">
                                <div className="text-center">
                                    <h3 className="text-lg font-semibold text-red-600">
                                        Erro ao carregar roteiro
                                    </h3>
                                    <p className="text-sm text-gray-600 mt-2">{error}</p>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {itinerary && (
                        <ItineraryVisualEditor
                            initialItinerary={itinerary}
                            itineraryId={params.id as string}
                            onSave={handleSave}
                            onClose={handleClose}
                        />
                    )}
                </main>
            </div>
        </div>
    )
}
