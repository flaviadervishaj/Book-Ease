import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import { CardSkeleton } from '../components/LoadingSkeleton'
import { SearchIcon, ClockIcon, MoneyIcon, StatsIcon, LocationIcon } from '../components/Icons'
import { formatPrice } from '../utils/formatPrice'
import './Services.css'

const CATALOG_CACHE_KEY = 'bookease:public-services'
const CATALOG_CACHE_TTL = 24 * 60 * 60 * 1000

const readCachedServices = () => {
  try {
    const cached = JSON.parse(localStorage.getItem(CATALOG_CACHE_KEY))
    return Array.isArray(cached?.services) && Date.now() - cached.savedAt < CATALOG_CACHE_TTL
      ? cached.services
      : []
  } catch {
    return []
  }
}

const Services = () => {
  const [services, setServices] = useState(readCachedServices)
  const [filteredServices, setFilteredServices] = useState([])
  const [loading, setLoading] = useState(services.length === 0)
  const [catalogReady, setCatalogReady] = useState(false)
  const [loadError, setLoadError] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('name')
  const [priceRange, setPriceRange] = useState(() => [
    0,
    services.length ? Math.ceil(Math.max(...services.map(s => s.price))) : 1000
  ])
  const navigate = useNavigate()

  useEffect(() => {
    fetchServices()
  }, [])

  useEffect(() => {
    filterAndSortServices()
  }, [services, searchQuery, sortBy, priceRange])

  const fetchServices = async () => {
    setLoading(services.length === 0)
    setLoadError(false)
    try {
      const response = await api.get('/services')
      const items = response.data.services || []
      setServices(items)
      setCatalogReady(true)
      try {
        localStorage.setItem(CATALOG_CACHE_KEY, JSON.stringify({ services: items, savedAt: Date.now() }))
      } catch {
        // Browsing still works when storage is unavailable.
      }
      if (items.length > 0) {
        const maxPrice = Math.max(...items.map(s => s.price))
        setPriceRange([0, Math.ceil(maxPrice)])
      }
    } catch (error) {
      setLoadError(true)
      setCatalogReady(false)
    } finally {
      setLoading(false)
    }
  }

  const filterAndSortServices = () => {
    let filtered = [...services]

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        service =>
          service.name.toLowerCase().includes(query) ||
          (service.description && service.description.toLowerCase().includes(query)) ||
          (service.address && service.address.toLowerCase().includes(query))
      )
    }

    filtered = filtered.filter(
      service => service.price >= priceRange[0] && service.price <= priceRange[1]
    )

    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'price':
          return a.price - b.price
        case 'duration':
          return a.duration_minutes - b.duration_minutes
        case 'name':
        default:
          return a.name.localeCompare(b.name)
      }
    })

    setFilteredServices(filtered)
  }

  const handleBook = (serviceId) => {
    navigate(`/book?service=${serviceId}`)
  }

  const maxPrice = services.length > 0 ? Math.max(...services.map(s => s.price)) : 1000

  if (loading) {
    return (
      <div className="services-page">
        <div className="page-header-compact">
          <h1>Our Services</h1>
        </div>
        <p className="catalog-status" role="status">Connecting to the booking service. This may take a moment.</p>
        <CardSkeleton count={6} />
      </div>
    )
  }

  return (
    <div className="services-page">
      <div className="page-header-compact">
        <div className="header-left">
          <h1>Our Services</h1>
          <span className="service-count-inline">
            {filteredServices.length} of {services.length} Services
          </span>
        </div>
        <div className="search-box-inline">
          <SearchIcon />
          <input
            type="text"
            placeholder="Search services..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input-inline"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="search-clear"
              title="Clear search"
            >
              ×
            </button>
          )}
        </div>
      </div>

      <div className="services-controls">
        <div className="filters-group">
          <div className="sort-controls">
            <label>Sort by:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="sort-select"
            >
              <option value="name">Name (A-Z)</option>
              <option value="price">Price (Low to High)</option>
              <option value="duration">Duration (Short to Long)</option>
            </select>
          </div>

          <div className="price-filter">
            <label>Price Range: {formatPrice(priceRange[0])} - {formatPrice(priceRange[1])}</label>
            <div className="price-slider-container">
              <input
                type="range"
                min="0"
                max={maxPrice}
                value={priceRange[1]}
                onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                className="price-slider"
              />
            </div>
          </div>
        </div>
      </div>

      {!catalogReady && services.length > 0 && (
        <div className="catalog-status" role="status">
          <span>{loadError ? 'Could not refresh services. Showing the last available catalog.' : 'Refreshing services and booking availability…'}</span>
          {loadError && <button onClick={fetchServices} className="btn btn-secondary">Try Again</button>}
        </div>
      )}

      {loadError && services.length === 0 ? (
        <div className="empty-state" role="alert">
          <h3>Services could not be loaded</h3>
          <p>Please try again in a moment.</p>
          <button onClick={fetchServices} className="btn btn-primary">Try Again</button>
        </div>
      ) : filteredServices.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <SearchIcon />
          </div>
          <h3>
            {searchQuery || priceRange[1] < maxPrice ? 'No services found' : 'No services available'}
          </h3>
          <p>
            {searchQuery || priceRange[1] < maxPrice
              ? 'Try adjusting your filters or search term'
              : 'Check back later for available services.'}
          </p>
          {(searchQuery || priceRange[1] < maxPrice) && (
            <button
              onClick={() => {
                setSearchQuery('')
                setPriceRange([0, maxPrice])
              }}
              className="btn btn-secondary"
            >
              Clear All Filters
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="services-grid">
            {filteredServices.map((service) => {
              const isPopular = service.price >= 50
              const isNew = service.duration_minutes <= 20
              
              return (
                <div key={service.id} className={`service-card ${isPopular ? 'popular' : ''}`}>
                  {isPopular && <div className="popular-badge">Popular</div>}
                  {isNew && <div className="new-badge">Quick Service</div>}
                  
                  <div className="service-image-container">
                    {service.image_url ? (
                      <img 
                        src={service.image_url} 
                        alt={service.name}
                        className="service-image"
                        loading="lazy"
                        onError={(e) => {
                          e.target.src = 'https://images.unsplash.com/photo-1562322140-8baeececf3df?w=800&h=600&fit=crop'
                        }}
                      />
                    ) : (
                      <div className="service-image-placeholder">
                        <span>{service.name.charAt(0)}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="service-content">
                    <div className="service-header">
                      <h3>{service.name}</h3>
                      <div className="service-price">{formatPrice(service.price)}</div>
                    </div>
                    
                    {service.description && (
                      <p className="service-description">{service.description}</p>
                    )}
                    
                    {service.address && (
                      <div className="service-address">
                        <LocationIcon />
                        <span>{service.address}</span>
                      </div>
                    )}
                    
                    <div className="service-details">
                      <div className="detail-item">
                        <ClockIcon />
                        <span className="detail-text">{service.duration_minutes} min</span>
                      </div>
                      <div className="detail-item">
                        <MoneyIcon />
                        <span className="detail-text">
                          {formatPrice(service.price / service.duration_minutes)}/min
                        </span>
                      </div>
                    </div>

                    {service.price === 0 && (
                      <div className="free-badge">FREE</div>
                    )}
                    
                    <button
                      onClick={() => handleBook(service.id)}
                      className="btn btn-primary service-book-btn"
                      disabled={!catalogReady}
                    >
                      {!catalogReady ? 'Checking availability…' : service.price === 0 ? 'Book Free Consultation' : 'Book Now →'}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="services-summary">
            <div className="summary-card">
              <StatsIcon />
              <div className="summary-content">
                <div className="summary-value">{services.length}</div>
                <div className="summary-label">Total Services</div>
              </div>
            </div>
            <div className="summary-card">
              <ClockIcon />
              <div className="summary-content">
                <div className="summary-value">
                  {Math.round(services.reduce((acc, s) => acc + s.duration_minutes, 0) / services.length)} min
                </div>
                <div className="summary-label">Avg Duration</div>
              </div>
            </div>
            <div className="summary-card">
              <MoneyIcon />
              <div className="summary-content">
                <div className="summary-value">
                  {formatPrice(Math.round(services.reduce((acc, s) => acc + s.price, 0) / services.length))}
                </div>
                <div className="summary-label">Avg Price</div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default Services
