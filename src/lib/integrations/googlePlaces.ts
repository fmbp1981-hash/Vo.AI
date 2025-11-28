/**
 * Google Places API Integration
 *
 * For destination information, attractions, restaurants, and reviews
 * Enable at: https://console.cloud.google.com/apis/library/places-backend.googleapis.com
 *
 * Required env vars:
 * - GOOGLE_PLACES_API_KEY
 */

import axios from 'axios'

const PLACES_API_BASE = 'https://maps.googleapis.com/maps/api/place'
const GEOCODING_API_BASE = 'https://maps.googleapis.com/maps/api/geocode'

interface PlaceSearchParams {
  query?: string
  location?: { lat: number; lng: number }
  radius?: number
  type?: string
  minprice?: number
  maxprice?: number
}

class GooglePlacesService {
  private apiKey: string

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  /**
   * Search for places (attractions, restaurants, etc.)
   */
  async searchPlaces({
    query,
    location,
    radius = 5000,
    type,
    minprice,
    maxprice,
  }: PlaceSearchParams) {
    try {
      const params: any = {
        key: this.apiKey,
      }

      if (query) {
        params.query = query
      }

      if (location) {
        params.location = `${location.lat},${location.lng}`
        params.radius = radius
      }

      if (type) {
        params.type = type
      }

      if (minprice !== undefined) {
        params.minprice = minprice
      }

      if (maxprice !== undefined) {
        params.maxprice = maxprice
      }

      const response = await axios.get(
        `${PLACES_API_BASE}/textsearch/json`,
        { params }
      )

      if (response.data.status !== 'OK' && response.data.status !== 'ZERO_RESULTS') {
        throw new Error(`Google Places API error: ${response.data.status}`)
      }

      return response.data.results
    } catch (error: any) {
      console.error('Google Places Search Error:', error.response?.data || error)
      throw new Error('Failed to search places')
    }
  }

  /**
   * Get place details
   */
  async getPlaceDetails(placeId: string) {
    try {
      const response = await axios.get(
        `${PLACES_API_BASE}/details/json`,
        {
          params: {
            place_id: placeId,
            key: this.apiKey,
            fields: 'name,rating,formatted_address,formatted_phone_number,opening_hours,website,photos,reviews,price_level,types,geometry',
          },
        }
      )

      if (response.data.status !== 'OK') {
        throw new Error(`Google Places API error: ${response.data.status}`)
      }

      return response.data.result
    } catch (error: any) {
      console.error('Google Place Details Error:', error.response?.data || error)
      throw new Error('Failed to get place details')
    }
  }

  /**
   * Get nearby attractions
   */
  async getNearbyAttractions({
    location,
    radius = 5000,
    type = 'tourist_attraction',
  }: {
    location: { lat: number; lng: number }
    radius?: number
    type?: string
  }) {
    try {
      const response = await axios.get(
        `${PLACES_API_BASE}/nearbysearch/json`,
        {
          params: {
            location: `${location.lat},${location.lng}`,
            radius,
            type,
            key: this.apiKey,
          },
        }
      )

      if (response.data.status !== 'OK' && response.data.status !== 'ZERO_RESULTS') {
        throw new Error(`Google Places API error: ${response.data.status}`)
      }

      return response.data.results
    } catch (error: any) {
      console.error('Google Nearby Attractions Error:', error.response?.data || error)
      throw new Error('Failed to get nearby attractions')
    }
  }

  /**
   * Get top restaurants in area
   */
  async getTopRestaurants({
    location,
    radius = 5000,
    minRating = 4.0,
  }: {
    location: { lat: number; lng: number }
    radius?: number
    minRating?: number
  }) {
    try {
      const response = await axios.get(
        `${PLACES_API_BASE}/nearbysearch/json`,
        {
          params: {
            location: `${location.lat},${location.lng}`,
            radius,
            type: 'restaurant',
            key: this.apiKey,
          },
        }
      )

      if (response.data.status !== 'OK' && response.data.status !== 'ZERO_RESULTS') {
        throw new Error(`Google Places API error: ${response.data.status}`)
      }

      // Filter by rating
      const filtered = response.data.results.filter(
        (place: any) => place.rating >= minRating
      )

      // Sort by rating descending
      filtered.sort((a: any, b: any) => b.rating - a.rating)

      return filtered.slice(0, 10) // Top 10
    } catch (error: any) {
      console.error('Google Restaurants Error:', error.response?.data || error)
      throw new Error('Failed to get restaurants')
    }
  }

  /**
   * Geocode address to coordinates
   */
  async geocodeAddress(address: string): Promise<{
    lat: number
    lng: number
    formattedAddress: string
  }> {
    try {
      const response = await axios.get(
        `${GEOCODING_API_BASE}/json`,
        {
          params: {
            address,
            key: this.apiKey,
          },
        }
      )

      if (response.data.status !== 'OK') {
        throw new Error(`Geocoding error: ${response.data.status}`)
      }

      const result = response.data.results[0]

      return {
        lat: result.geometry.location.lat,
        lng: result.geometry.location.lng,
        formattedAddress: result.formatted_address,
      }
    } catch (error: any) {
      console.error('Geocoding Error:', error.response?.data || error)
      throw new Error('Failed to geocode address')
    }
  }

  /**
   * Get photo URL
   */
  getPhotoUrl(photoReference: string, maxWidth = 400): string {
    return `${PLACES_API_BASE}/photo?maxwidth=${maxWidth}&photo_reference=${photoReference}&key=${this.apiKey}`
  }

  /**
   * Get destination overview (city info + top attractions + restaurants)
   */
  async getDestinationOverview(destinationName: string) {
    try {
      // First, geocode the destination
      const location = await this.geocodeAddress(destinationName)

      // Get attractions
      const attractions = await this.getNearbyAttractions({
        location: { lat: location.lat, lng: location.lng },
        radius: 10000, // 10km
      })

      // Get restaurants
      const restaurants = await this.getTopRestaurants({
        location: { lat: location.lat, lng: location.lng },
        radius: 10000,
      })

      return {
        destination: {
          name: destinationName,
          formattedAddress: location.formattedAddress,
          coordinates: {
            lat: location.lat,
            lng: location.lng,
          },
        },
        topAttractions: attractions.slice(0, 10),
        topRestaurants: restaurants.slice(0, 10),
      }
    } catch (error: any) {
      console.error('Destination Overview Error:', error)
      throw new Error('Failed to get destination overview')
    }
  }
}

// Singleton instance
let googlePlacesInstance: GooglePlacesService | null = null

export function getGooglePlacesService(): GooglePlacesService {
  if (!googlePlacesInstance) {
    const apiKey = process.env.GOOGLE_PLACES_API_KEY

    if (!apiKey) {
      throw new Error('Google Places API key not configured')
    }

    googlePlacesInstance = new GooglePlacesService(apiKey)
  }

  return googlePlacesInstance
}

export { GooglePlacesService }
