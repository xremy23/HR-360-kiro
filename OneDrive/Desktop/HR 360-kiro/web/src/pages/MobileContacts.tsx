import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';

interface PhoneContact {
  id: string;
  name: string;
  role: string;
  phone: string;
  email: string;
  description: string;
  category: 'emergency' | 'medical' | 'organization' | 'veterinary' | 'government';
  distance?: number;
  latitude?: number;
  longitude?: number;
}

const MobileContacts: React.FC = () => {
  const navigate = useNavigate();
  const { user, accessMode, token } = useSelector((state: RootState) => state.auth);
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'emergency' | 'medical' | 'organization' | 'veterinary' | 'government'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [contacts, setContacts] = useState<PhoneContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  // Fetch contacts - always start with defaults, only request location if user is authenticated
  useEffect(() => {
    const fetchContacts = async () => {
      try {
        // Always show defaults first
        setContacts(getDefaultContacts());
        setLoading(false);
        
        // Only try location-based contacts if user is authenticated
        if (!token) {
          return; // Guest user - just use defaults
        }

        // For authenticated users, request location permission properly
        if (navigator.geolocation) {
          // Check permission status first
          if (navigator.permissions && navigator.permissions.query) {
            try {
              const permStatus = await navigator.permissions.query({ name: 'geolocation' as any });
              
              if (permStatus.state === 'granted') {
                // Permission already granted, get position
                requestLocationAndContacts();
              } else if (permStatus.state === 'prompt') {
                // Permission not yet requested, this will trigger the permission dialog
                requestLocationAndContacts();
              } else {
                // Permission denied previously
                console.warn('Location permission previously denied');
              }
              
              // Listen for permission changes
              permStatus.addEventListener('change', () => {
                if (permStatus.state === 'granted') {
                  requestLocationAndContacts();
                }
              });
            } catch (permError) {
              console.warn('Permission API not available, requesting location directly', permError);
              // Permission API not available, try direct request
              requestLocationAndContacts();
            }
          } else {
            // Permission API not available, request location directly
            requestLocationAndContacts();
          }
        }
      } catch (error) {
        console.error('Error fetching contacts:', error);
        setContacts(getDefaultContacts());
        setLoading(false);
      }
    };

    const requestLocationAndContacts = async () => {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ latitude, longitude });

          // Try to fetch nearby contacts based on location
          try {
            const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';
            const response = await fetch(
              `${apiUrl}/location/nearby/contacts?latitude=${latitude}&longitude=${longitude}&radius=20`,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              }
            );

            if (response.ok) {
              const data = await response.json();
              const apiContacts = (data.data || data || []).filter((c: any) => c.name && c.phone);
              
              // If we got location-based results, use them
              if (apiContacts.length > 0) {
                const mappedContacts = apiContacts.map((contact: any) => ({
                  id: contact.id,
                  name: contact.name,
                  role: contact.role,
                  phone: contact.phone,
                  email: contact.email,
                  description: contact.description || `${contact.distance?.toFixed(2) || '?'} km away`,
                  category: contact.category || 'emergency',
                  distance: contact.distance,
                  latitude: contact.latitude,
                  longitude: contact.longitude,
                }));
                setContacts(mappedContacts);
              }
            }
          } catch (error) {
            console.error('Error fetching nearby contacts:', error);
            // Keep showing defaults
          }
        },
        (error) => {
          console.warn('Location request failed or denied:', error);
          // Permission denied, keep showing defaults
          // Error codes: 1 = PERMISSION_DENIED, 2 = POSITION_UNAVAILABLE, 3 = TIMEOUT
          if (error.code === 1) {
            console.warn('User denied location permission');
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000, // 5 minutes
        }
      );
    };

    fetchContacts();
  }, [token]);

  // Default hardcoded contacts for fallback
  const getDefaultContacts = (): PhoneContact[] => [
    // EMERGENCY RESPONDERS
    {
      id: 'e1',
      name: 'National Emergency Hotline',
      role: 'Emergency',
      phone: '911',
      email: 'emergency@pnp.gov.ph',
      description: 'Primary emergency response - Police, Fire, Medical',
      category: 'emergency',
    },
    {
      id: 'e1a',
      name: 'Philippine National Police',
      role: 'Emergency - Police',
      phone: '117 / +63 2 724-7624',
      email: 'information@pnp.gov.ph',
      description: 'Police emergency hotline - Crime, accidents, disturbances',
      category: 'emergency',
    },
    {
      id: 'e1b',
      name: 'Bureau of Fire Protection',
      role: 'Emergency - Fire Department',
      phone: '160 / +63 2 426-0219',
      email: 'bfp.operations@fire.gov.ph',
      description: 'Fire emergency response - Fires, rescue operations',
      category: 'emergency',
    },
    {
      id: 'e1c',
      name: 'National Suicide Prevention Hotline',
      role: 'Emergency - Mental Health',
      phone: '1553 / +63 917 558-1553',
      email: 'support@mentalhealthph.org',
      description: '24/7 suicide prevention and crisis counseling support',
      category: 'emergency',
    },
    {
      id: 'e2',
      name: 'Disaster Risk Reduction Management',
      role: 'Emergency',
      phone: '+63 2 911-5061',
      email: 'operations@ndrrmc.gov.ph',
      description: 'National disaster coordination and response',
      category: 'emergency',
    },
    {
      id: 'e3',
      name: 'Philippine Red Cross - Metro Manila',
      role: 'Emergency',
      phone: '+63 2 554-2034',
      email: 'metromm@redcross.org.ph',
      description: 'Emergency medical aid and disaster relief',
      category: 'emergency',
    },

    // LOCAL GOVERNMENT - PASIG
    {
      id: 'g1',
      name: 'Pasig City Hall',
      role: 'Government',
      phone: '+63 2 645-7896',
      email: 'info@pasigcity.gov.ph',
      description: 'Pasig City Emergency Operations - Barangay coordination',
      category: 'government',
    },
    {
      id: 'g2',
      name: 'Barangay Ugong',
      role: 'Government',
      phone: '+63 2 645-8234',
      email: 'brgy.ugong@pasig.gov.ph',
      description: 'Nearest barangay hall (Ortigas area)',
      category: 'government',
    },
    {
      id: 'g3',
      name: 'Barangay Pinagbuhatan',
      role: 'Government',
      phone: '+63 2 645-9123',
      email: 'brgy.pinagbuhatan@pasig.gov.ph',
      description: 'Evacuation center and relief distribution',
      category: 'government',
    },

    // MEDICAL FACILITIES
    {
      id: 'm1',
      name: 'Pasig City General Hospital',
      role: 'Medical Facility',
      phone: '+63 2 645-4567',
      email: 'admissions@pcgh.gov.ph',
      description: 'Primary public hospital - Emergency room available 24/7',
      category: 'medical',
    },
    {
      id: 'm2',
      name: 'Makati Medical Center - Pasig Branch',
      role: 'Medical Facility',
      phone: '+63 2 888-8888',
      email: 'er@makatimedical.com',
      description: 'Private medical facility with trauma center',
      category: 'medical',
    },
    {
      id: 'm3',
      name: 'Amparo Clinic',
      role: 'Medical Facility',
      phone: '+63 2 645-1234',
      email: 'info@amparoclinic.ph',
      description: 'Emergency clinic near Ortigas - Walk-in available',
      category: 'medical',
    },
    {
      id: 'm4',
      name: 'Metropolitan Hospital',
      role: 'Medical Facility',
      phone: '+63 2 729-0000',
      email: 'emergency@methosp.com',
      description: 'Full-service hospital with ICU and specialized care',
      category: 'medical',
    },

    // VETERINARY SERVICES
    {
      id: 'v1',
      name: 'Pasig Animal Rescue Center',
      role: 'Veterinary Service',
      phone: '+63 2 645-5678',
      email: 'rescue@pasigpets.org.ph',
      description: 'Animal evacuation and emergency veterinary care',
      category: 'veterinary',
    },
    {
      id: 'v2',
      name: 'Metro Manila Veterinary Hospital',
      role: 'Veterinary Service',
      phone: '+63 2 645-9876',
      email: 'emergency@mmvh.ph',
      description: '24/7 emergency vet services - Pet evacuation support',
      category: 'veterinary',
    },

    // ORGANIZATION TEAM LEADS
    {
      id: 'o1',
      name: 'Maria Santos - Team Lead',
      role: 'Organization | Supervisor',
      phone: '+63 917 555-1234',
      email: 'maria.santos@corporate.com',
      description: 'Your direct Team Lead - Product Infrastructure Core',
      category: 'organization',
    },
    {
      id: 'o2',
      name: 'Paolo Reyes - Department Head',
      role: 'Organization | Manager',
      phone: '+63 917 555-5678',
      email: 'paolo.reyes@corporate.com',
      description: 'Engineering Operations Department Head',
      category: 'organization',
    },
    {
      id: 'o3',
      name: 'Security Operations Center',
      role: 'Organization | Emergency',
      phone: '+63 917 555-9999',
      email: 'soc@corporate.com',
      description: 'Internal security and emergency coordinator',
      category: 'organization',
    },
    {
      id: 'o4',
      name: 'HR Crisis Management',
      role: 'Organization | Emergency',
      phone: '+63 917 555-8888',
      email: 'crisis@corporate.com',
      description: 'Company crisis response and employee support',
      category: 'organization',
    },
  ];

  // Determine if user can see organization contacts
  const canSeeOrgContacts = accessMode === 'authenticated-with-org' || accessMode === 'admin';

  // Filter contacts based on access mode and category
  const filteredContacts = contacts.filter((contact) => {
    // Hide org contacts from guest and authenticated-no-org users
    if (!canSeeOrgContacts && contact.category === 'organization') {
      return false;
    }

    const matchesCategory =
      selectedCategory === 'all' || contact.category === selectedCategory;
    const matchesSearch =
      !searchQuery ||
      contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.phone.includes(searchQuery) ||
      contact.description.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  // Get badge color based on category
  const getBadgeColor = (category: string) => {
    switch (category) {
      case 'emergency':
        return 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400';
      case 'medical':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400';
      case 'veterinary':
        return 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400';
      case 'government':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400';
      case 'organization':
        return 'bg-[#038F8D]/15 text-[#038F8D] dark:bg-[#038F8D]/20 dark:text-[#49D7D1]';
      default:
        return 'bg-stone-100 text-stone-700 dark:bg-neutral-800 dark:text-neutral-400';
    }
  };

  // Get category emoji
  const getCategoryEmoji = (category: string) => {
    switch (category) {
      case 'emergency':
        return '🚨';
      case 'medical':
        return '🏥';
      case 'veterinary':
        return '🐾';
      case 'government':
        return '🏛️';
      case 'organization':
        return '🏢';
      default:
        return '📞';
    }
  };

  const handleDialClick = (contact: PhoneContact) => {
    // In a real app, this would trigger a VoIP call or native phone dialer
    alert(`📞 Initiating call to ${contact.name}\nPhone: ${contact.phone}\n\nIn production, this would connect to VoIP system.`);
  };

  return (
    <div className="w-full min-h-screen bg-stone-50 dark:bg-neutral-950 px-4 py-6 pb-24">
      {/* HEADER */}
      <header className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-850 transition text-neutral-700 dark:text-neutral-300"
        >
          ←
        </button>
        <div>
          <h1 className="font-extrabold text-lg text-[#038F8D] dark:text-[#49D7D1]">
            Emergency Directory
          </h1>
          <p className="text-[11px] text-stone-400 dark:text-neutral-500">
            {loading
              ? '📍 Locating nearby contacts...'
              : userLocation
              ? `📍 ${filteredContacts.length} contact${filteredContacts.length !== 1 ? 's' : ''} found near you`
              : canSeeOrgContacts
              ? 'All emergency, medical, government, and organization contacts'
              : 'Emergency, medical, government, and veterinary contacts'}
          </p>
        </div>
      </header>

      {/* SEARCH BAR */}
      <div className="mb-4 relative">
        <span className="absolute left-3 top-3 text-stone-400 dark:text-neutral-500">🔍</span>
        <input
          type="text"
          placeholder="Search contacts or phone number..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full text-xs p-2.5 pl-9 pr-3 rounded-xl border border-stone-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-stone-800 dark:text-stone-100 placeholder-stone-400 dark:placeholder-neutral-600 focus:outline-none focus:border-[#038F8D] focus:ring-1 focus:ring-[#038F8D]/20 transition-all"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-3 text-stone-400 hover:text-stone-600 dark:hover:text-stone-300"
          >
            ✕
          </button>
        )}
      </div>

      {/* CATEGORY TABS */}
      <div className="mb-4 flex gap-1.5 overflow-x-auto pb-2 scrollbar-none">
        {[
          { value: 'all', label: 'All', emoji: '📞' },
          { value: 'emergency', label: 'Emergency', emoji: '🚨' },
          { value: 'medical', label: 'Medical', emoji: '🏥' },
          { value: 'government', label: 'Government', emoji: '🏛️' },
          ...(canSeeOrgContacts ? [{ value: 'organization', label: 'Organization', emoji: '🏢' }] : []),
          { value: 'veterinary', label: 'Veterinary', emoji: '🐾' },
        ].map((cat) => (
          <button
            key={cat.value}
            onClick={() => setSelectedCategory(cat.value as any)}
            className={`px-3 py-1.5 rounded-xl text-[10px] font-bold tracking-wide shrink-0 transition-all ${
              selectedCategory === cat.value
                ? 'bg-[#038F8D] text-white shadow-sm'
                : 'bg-stone-200/60 text-stone-650 hover:bg-stone-200 dark:bg-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-850'
            }`}
          >
            {cat.emoji} {cat.label}
          </button>
        ))}
      </div>

      {/* CONTACTS LIST */}
      <div className="space-y-3">
        {loading ? (
          <div className="p-8 bg-white dark:bg-neutral-900 rounded-2xl border border-stone-150 dark:border-neutral-850 text-center">
            <div className="text-3xl mb-3">📍</div>
            <p className="text-sm text-stone-400 dark:text-neutral-500">
              Getting your location to find nearby emergency contacts...
            </p>
          </div>
        ) : filteredContacts.length === 0 ? (
          <div className="p-8 bg-white dark:bg-neutral-900 rounded-2xl border border-stone-150 dark:border-neutral-850 text-center">
            <p className="text-sm text-stone-400 dark:text-neutral-500">
              No contacts found matching your search.
            </p>
          </div>
        ) : (
          filteredContacts.map((contact) => (
            <div
              key={contact.id}
              className="p-4 bg-white dark:bg-neutral-900 border border-stone-150 dark:border-neutral-800 rounded-2xl space-y-2.5 shadow-xs hover:border-[#038F8D]/30 dark:hover:border-[#038F8D]/30 transition-all"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  {/* Role Badge */}
                  <span className={`text-[8px] uppercase font-bold px-2 py-0.5 rounded-full inline-block ${getBadgeColor(contact.category)}`}>
                    {getCategoryEmoji(contact.category)} {contact.role}
                  </span>
                  {/* Contact Name */}
                  <h3 className="font-extrabold text-sm text-neutral-800 dark:text-stone-100 tracking-tight mt-1.5">
                    {contact.name}
                  </h3>
                </div>
                {/* Dial Button */}
                <button
                  onClick={() => handleDialClick(contact)}
                  className="bg-[#038F8D]/10 hover:bg-[#038F8D] text-[#038F8D] hover:text-white p-2.5 rounded-2xl transition-all cursor-pointer active:scale-90 shrink-0"
                  title={`Dial ${contact.phone}`}
                >
                  📞
                </button>
              </div>

              {/* Description */}
              <p className="text-[11px] text-stone-700 dark:text-stone-400 leading-tight">
                {contact.description}
              </p>

              {/* Contact Info Footer */}
              <div className="grid grid-cols-2 text-[10px] pt-2 border-t border-stone-100 dark:border-neutral-800 text-stone-400 dark:text-neutral-500">
                <div className="font-mono truncate">
                  📞 <span className="text-neutral-700 dark:text-stone-300 font-semibold select-all text-[9px]">
                    {contact.phone}
                  </span>
                </div>
                <div className="truncate text-right font-mono text-[9px]">
                  ✉️ <span className="select-all text-neutral-700 dark:text-stone-300 font-semibold">
                    {contact.email.split('@')[0]}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default MobileContacts;
