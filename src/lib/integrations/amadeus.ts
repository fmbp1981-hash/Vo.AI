/**
 * Amadeus API Integration
 *
 * For flight search, hotel search, and travel recommendations
 * Sign up at: https://developers.amadeus.com/
 *
 * Required env vars:
 * - AMADEUS_API_KEY
 * - AMADEUS_API_SECRET
 */

import axios from 'axios'

const AMADEUS_BASE_URL = 'https://api.amadeus.com/v2'
const AMADEUS_AUTH_URL = 'https://api.amadeus.com/v1/security/oauth2/token'

interface AmadeusConfig {
  apiKey: string
  apiSecret: string
}

class AmadeusService {
  private apiKey: string
  private apiSecret: string
  private accessToken: string | null = null
  private tokenExpiry: number = 0

  constructor(config: AmadeusConfig) {
    this.apiKey = config.apiKey
    this.apiSecret = config.apiSecret
  }

  /**
   * Get access token (cached until expiry)
   */
  private async getAccessToken(): Promise<string> {
    // Return cached token if still valid
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken
    }

    try {
      const response = await axios.post(
        AMADEUS_AUTH_URL,
        new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: this.apiKey,
          client_secret: this.apiSecret,
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      )

      this.accessToken = response.data.access_token
      // Set expiry to 30 minutes (token lasts 30 min)
      this.tokenExpiry = Date.now() + 29 * 60 * 1000

      return this.accessToken
    } catch (error) {
      console.error('Amadeus Auth Error:', error)
      throw new Error('Failed to authenticate with Amadeus API')
    }
  }

  /**
   * Search for flights
   */
  async searchFlights({
    origin,
    destination,
    departureDate,
    returnDate,
    adults = 1,
    travelClass = 'ECONOMY',
    maxResults = 10,
  }: {
    origin: string // IATA code (e.g., GRU)
    destination: string // IATA code (e.g., CDG)
    departureDate: string // YYYY-MM-DD
    returnDate?: string // YYYY-MM-DD
    adults?: number
    travelClass?: 'ECONOMY' | 'PREMIUM_ECONOMY' | 'BUSINESS' | 'FIRST'
    maxResults?: number
  }) {
    try {
      const token = await this.getAccessToken()

      const params: any = {
        originLocationCode: origin,
        destinationLocationCode: destination,
        departureDate,
        adults,
        travelClass,
        max: maxResults,
      }

      if (returnDate) {
        params.returnDate = returnDate
      }

      const response = await axios.get(
        `${AMADEUS_BASE_URL}/shopping/flight-offers`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          params,
        }
      )

      return response.data.data
    } catch (error: any) {
      console.error('Amadeus Flight Search Error:', error.response?.data || error)
      throw new Error('Failed to search flights')
    }
  }

  /**
   * Get flight price analysis
   */
  async getFlightPriceAnalysis({
    origin,
    destination,
    departureDate,
  }: {
    origin: string
    destination: string
    departureDate: string
  }) {
    try {
      const token = await this.getAccessToken()

      const response = await axios.get(
        `${AMADEUS_BASE_URL}/analytics/itinerary-price-metrics`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          params: {
            originIataCode: origin,
            destinationIataCode: destination,
            departureDate,
          },
        }
      )

      return response.data.data
    } catch (error: any) {
      console.error('Amadeus Price Analysis Error:', error.response?.data || error)
      throw new Error('Failed to get price analysis')
    }
  }

  /**
   * Search for hotels by city
   */
  async searchHotelsByCity({
    cityCode,
    checkInDate,
    checkOutDate,
    adults = 1,
    radius = 5,
    radiusUnit = 'KM',
  }: {
    cityCode: string // IATA code (e.g., PAR)
    checkInDate: string // YYYY-MM-DD
    checkOutDate: string // YYYY-MM-DD
    adults?: number
    radius?: number
    radiusUnit?: 'KM' | 'MILE'
  }) {
    try {
      const token = await this.getAccessToken()

      const response = await axios.get(
        `${AMADEUS_BASE_URL}/shopping/hotel-offers`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          params: {
            cityCode,
            checkInDate,
            checkOutDate,
            adults,
            radius,
            radiusUnit,
          },
        }
      )

      return response.data.data
    } catch (error: any) {
      console.error('Amadeus Hotel Search Error:', error.response?.data || error)
      throw new Error('Failed to search hotels')
    }
  }

  /**
   * Get points of interest (attractions)
   */
  async getPointsOfInterest({
    latitude,
    longitude,
    radius = 1,
  }: {
    latitude: number
    longitude: number
    radius?: number
  }) {
    try {
      const token = await this.getAccessToken()

      const response = await axios.get(
        `${AMADEUS_BASE_URL}/shopping/activities`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          params: {
            latitude,
            longitude,
            radius,
          },
        }
      )

      return response.data.data
    } catch (error: any) {
      console.error('Amadeus POI Error:', error.response?.data || error)
      throw new Error('Failed to get points of interest')
    }
  }
}

// Singleton instance
let amadeusInstance: AmadeusService | null = null

export function getAmadeusService(): AmadeusService {
  if (!amadeusInstance) {
    const apiKey = process.env.AMADEUS_API_KEY
    const apiSecret = process.env.AMADEUS_API_SECRET

    if (!apiKey || !apiSecret) {
      throw new Error('Amadeus API credentials not configured')
    }

    amadeusInstance = new AmadeusService({
      apiKey,
      apiSecret,
    })
  }

  return amadeusInstance
}

export type { AmadeusConfig }
export { AmadeusService }
