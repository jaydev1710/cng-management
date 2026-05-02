'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { companyService, ticketService, deviceService } from '@/lib/firebase-services';

export default function NewTicketPage() {
  const router = useRouter();
  const [isMobile, setIsMobile] = useState(false);
  const [companySearch, setCompanySearch] = useState('');
  const [showCompanyDropdown, setShowCompanyDropdown] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedProduct, setSelectedProduct] = useState('');
  const [ticketGenerated, setTicketGenerated] = useState(false);
  const [ticketNumber, setTicketNumber] = useState('');
  const [loading, setLoading] = useState(false);
  
  // State for real companies from Firebase
  const [companies, setCompanies] = useState<any[]>([]);
  const [loadingCompanies, setLoadingCompanies] = useState(true);
  // State for alerts
  const [alert, setAlert] = useState<{ type: 'success' | 'error' | 'warning' | 'info'; message: string } | null>(null);
  
  // State for devices from database
  const [devices, setDevices] = useState<any[]>([]);
  const [loadingDevices, setLoadingDevices] = useState(true);
  
  // Product catalog organized by category
  const [productCatalog, setProductCatalog] = useState<Record<string, string[]>>({});

  // Check if mobile view
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Auto hide alert after 3 seconds
  useEffect(() => {
    if (alert) {
      const timer = setTimeout(() => {
        setAlert(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [alert]);

  // Fetch companies from Firebase
  useEffect(() => {
    fetchCompanies();
    fetchDevices();
  }, []);

  const fetchCompanies = async () => {
    try {
      setLoadingCompanies(true);
      const data = await companyService.getAll();
      const transformedCompanies = data.map((item: any) => ({
        id: item.documentId,
        name: item.name || '',
        location: item.location || '',
        contact: item.phone || item.contact || '',
        email: item.email || ''
      }));
      setCompanies(transformedCompanies);
    } catch (error) {
      console.error('Error fetching companies:', error);
      setAlert({ type: 'error', message: 'Failed to load companies. Please refresh the page.' });
    } finally {
      setLoadingCompanies(false);
    }
  };

  // Fetch devices from database
  const fetchDevices = async () => {
    try {
      setLoadingDevices(true);
      // Assuming you have a deviceService with getAll method
      const devicesData = await deviceService.getAll();
      
      setDevices(devicesData);
      
      // Organize devices by category
      const catalog: Record<string, string[]> = {
        'Mobile': [],
        'Laptop': [],
        'Desktop': [],
        'Printer': [],
        'Tablet': [],
        'Camera': [],
        'Other': []
      };
      
      devicesData.forEach((device: any) => {
        const category = device.category || device.deviceCategory || 'Other';
        const deviceName = device.name || device.deviceName || device.model || '';
        
        if (deviceName) {
          if (catalog[category]) {
            catalog[category].push(deviceName);
          } else {
            catalog['Other'].push(deviceName);
          }
        }
      });
      
      // Remove duplicates and sort
      Object.keys(catalog).forEach(key => {
        catalog[key] = [...new Set(catalog[key])].sort();
      });
      
      setProductCatalog(catalog);
      
    } catch (error) {
      console.error('Error fetching devices:', error);
      // Set default catalog if fetch fails
      setProductCatalog({
        'Mobile': ['iPhone 13', 'iPhone 14', 'Samsung S23', 'Samsung S24', 'OnePlus 11', 'Google Pixel 8'],
        'Laptop': ['Dell XPS', 'HP Pavilion', 'Lenovo ThinkPad', 'MacBook Pro', 'MacBook Air', 'ASUS ROG'],
        'Desktop': ['Dell Optiplex', 'HP EliteDesk', 'Lenovo ThinkCentre', 'Custom Build', 'iMac'],
        'Printer': ['HP LaserJet', 'Canon Pixma', 'Epson L3150', 'Brother DCP', 'Samsung Printer'],
        'Tablet': ['iPad Pro', 'iPad Air', 'Samsung Tab S9', 'Lenovo Tab', 'Mi Pad'],
        'Camera': ['Canon EOS', 'Nikon DSLR', 'Sony Alpha', 'GoPro', 'DJI Osmo'],
        'Other': ['Projector', 'Router', 'Hard Drive', 'Monitor', 'Accessories']
      });
      setAlert({ type: 'warning', message: 'Using default device catalog. Could not load devices from database.' });
    } finally {
      setLoadingDevices(false);
    }
  };

  // Filter companies based on search
  const filteredCompanies = companies.filter(company =>
    company.name.toLowerCase().includes(companySearch.toLowerCase())
  );

  // Filter products based on selected category
  const filteredProducts = selectedCategory ? productCatalog[selectedCategory] || [] : [];

  // Generate ticket number
  const generateTicketNumber = (): string => {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `TKT-${year}${month}${day}-${random}`;
  };

  const validatePhone = (phone: string): boolean => {
    const cleanPhone = phone.replace(/\D/g, '');
    return cleanPhone.length >= 10 && cleanPhone.length <= 15;
  };

  const formatWhatsAppMessage = (data: any, ticketId: string): string => {
    const message = `🔔 *NEW SUPPORT TICKET* 🔔

━━━━━━━━━━━━━━━━━━━
📋 *TICKET DETAILS*
━━━━━━━━━━━━━━━━━━━
🆔 *Ticket Number:* ${ticketId}
🏢 *Company:* ${data.company}
📅 *Date:* ${new Date().toLocaleDateString('en-IN')}
⏰ *Time:* ${new Date().toLocaleTimeString('en-IN')}

━━━━━━━━━━━━━━━━━━━
👤 *CONTACT PERSON*
━━━━━━━━━━━━━━━━━━━
📛 *Name:* ${data.contactName}
📞 *Phone:* ${data.contactPhone}
📧 *Email:* ${data.contactEmail || 'Not provided'}

━━━━━━━━━━━━━━━━━━━
📱 *DEVICE INFORMATION*
━━━━━━━━━━━━━━━━━━━
📂 *Category:* ${data.category}
🔧 *Device:* ${data.device}
⚠️ *Problem:* ${data.problem}

━━━━━━━━━━━━━━━━━━━
📝 *PROBLEM DESCRIPTION*
━━━━━━━━━━━━━━━━━━━
${data.description}

━━━━━━━━━━━━━━━━━━━
✅ *Your ticket has been successfully registered!*
🔧 *Our team will contact you shortly.*

Thank you for your patience! 🙏`;

    return message;
  };

  const sendToWhatsApp = (phone: string, message: string): boolean => {
    try {
      const cleanPhone = phone.replace(/\D/g, '');
      const encodedMessage = encodeURIComponent(message);
      const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
      window.open(whatsappUrl, '_blank');
      return true;
    } catch (error) {
      console.error('WhatsApp error:', error);
      return false;
    }
  };

  const createNewTicket = async (formData: any) => {
    if (!validatePhone(formData.contactPhone)) {
      setAlert({ type: 'warning', message: 'Please enter a valid phone number (10-15 digits)' });
      return;
    }

    setLoading(true);
    
    try {
      const newTicketNumber = generateTicketNumber();
      setTicketNumber(newTicketNumber);
      
      // Save to Firebase
      const ticketData = {
        ticketId: newTicketNumber,
        company: formData.company,
        companyId: formData.companyId || '',
        contact: formData.contactName,
        contactPhone: formData.contactPhone,
        contactEmail: formData.contactEmail,
        device: formData.device,
        problem: formData.problem,
        description: formData.description,
        category: formData.category,
        status: 'Open',
        createdDate: new Date().toLocaleString(),
        createdBy: 'Admin',
        assignedTo: 'Unassigned',
        dueDate: new Date(Date.now() + 86400000).toLocaleDateString(),
        attachments: 0,
        comments: 0,
        whatsappEnabled: true,
        createdAt: new Date().toISOString()
      };

      await ticketService.add(ticketData);
      
      const message = formatWhatsAppMessage(formData, newTicketNumber);
      const sent = sendToWhatsApp(formData.contactPhone, message);
      
      if (sent) {
        setTicketGenerated(true);
        setAlert({ type: 'success', message: `Ticket ${newTicketNumber} created successfully!` });
        
        setTimeout(() => {
          setTicketGenerated(false);
          setCompanySearch('');
          setSelectedCategory('');
          setSelectedProduct('');
          setLoading(false);
          router.push('/tickets');
        }, 5000);
      } else {
        setAlert({ type: 'error', message: 'Error opening WhatsApp. Please try again.' });
        setLoading(false);
      }
    } catch (error) {
      console.error('Error creating ticket:', error);
      setAlert({ type: 'error', message: 'Failed to create ticket. Please try again.' });
      setLoading(false);
    }
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setSelectedProduct('');
  };

  const handleCompanySelect = (company: any) => {
    setCompanySearch(company.name);
    setShowCompanyDropdown(false);
  };

  // Alert Component
  const AlertMessage = () => {
    if (!alert) return null;
    
    const alertStyles = {
      success: {
        background: '#d4edda',
        color: '#155724',
        border: '1px solid #c3e6cb',
        icon: '✅'
      },
      error: {
        background: '#f8d7da',
        color: '#721c24',
        border: '1px solid #f5c6cb',
        icon: '❌'
      },
      warning: {
        background: '#fff3cd',
        color: '#856404',
        border: '1px solid #ffeeba',
        icon: '⚠️'
      },
      info: {
        background: '#d1ecf1',
        color: '#0c5460',
        border: '1px solid #bee5eb',
        icon: 'ℹ️'
      }
    };
    
    const style = alertStyles[alert.type];
    
    return (
      <div style={{
        position: 'fixed',
        top: isMobile ? '70px' : '80px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 3000,
        minWidth: isMobile ? '280px' : '400px',
        maxWidth: '90%',
        padding: isMobile ? '12px 16px' : '14px 20px',
        background: style.background,
        color: style.color,
        border: style.border,
        borderRadius: '12px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        animation: 'slideDown 0.3s ease'
      }}>
        <span style={{ fontSize: isMobile ? '18px' : '20px' }}>{style.icon}</span>
        <span style={{ flex: 1, fontSize: isMobile ? '13px' : '14px', fontWeight: '500' }}>{alert.message}</span>
        <button
          onClick={() => setAlert(null)}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '18px',
            cursor: 'pointer',
            padding: '4px',
            color: style.color,
            opacity: 0.7
          }}
          onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
          onMouseLeave={(e) => e.currentTarget.style.opacity = '0.7'}
        >
          ×
        </button>
      </div>
    );
  };

  // Styles with equal spacing
  const styles = {
    container: {
      maxWidth: '900px',
      margin: '0 auto',
      padding: isMobile ? '15px' : '30px 20px'
    },
    header: {
      fontSize: isMobile ? '24px' : '32px',
      fontWeight: '700',
      color: '#075e54',
      marginBottom: '10px',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      flexWrap: 'wrap' as const
    },
    headerIcon: {
      fontSize: isMobile ? '32px' : '40px'
    },
    subHeader: {
      fontSize: isMobile ? '13px' : '15px',
      color: '#4b5563',
      marginBottom: isMobile ? '20px' : '30px',
      padding: isMobile ? '12px 15px' : '15px 20px',
      background: '#f0f9ff',
      borderRadius: '12px',
      borderLeft: '4px solid #25D366',
      lineHeight: '1.6'
    },
    successMessage: {
      background: '#d4edda',
      color: '#155724',
      padding: isMobile ? '15px' : '20px',
      borderRadius: '12px',
      marginBottom: isMobile ? '20px' : '25px',
      textAlign: 'center' as const,
      border: '1px solid #c3e6cb',
      animation: 'slideDown 0.3s ease'
    },
    successIcon: {
      fontSize: isMobile ? '40px' : '48px',
      marginBottom: '10px',
      display: 'block'
    },
    successTitle: {
      fontSize: isMobile ? '18px' : '20px',
      fontWeight: '600',
      marginBottom: '8px'
    },
    successText: {
      fontSize: isMobile ? '13px' : '15px',
      marginBottom: '5px'
    },
    ticketNumber: {
      background: '#155724',
      color: 'white',
      padding: isMobile ? '6px 12px' : '8px 16px',
      borderRadius: '30px',
      display: 'inline-block',
      marginTop: '10px',
      fontSize: isMobile ? '14px' : '18px',
      fontWeight: '600'
    },
    form: {
      background: 'white',
      padding: isMobile ? '20px' : '35px',
      borderRadius: '16px',
      boxShadow: '0 10px 40px rgba(0,0,0,0.08)',
      border: '1px solid #e5e7eb'
    },
    section: {
      marginBottom: isMobile ? '25px' : '35px'
    },
    sectionTitle: {
      fontSize: isMobile ? '16px' : '18px',
      fontWeight: '600',
      color: '#1f2937',
      marginBottom: isMobile ? '15px' : '20px',
      paddingBottom: isMobile ? '10px' : '12px',
      borderBottom: '2px solid #e5e7eb',
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    },
    grid2: {
      display: 'grid',
      gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
      gap: isMobile ? '15px' : '20px'
    },
    fullWidth: {
      gridColumn: 'span 2'
    },
    fieldGroup: {
      marginBottom: '5px'
    },
    label: {
      display: 'block',
      marginBottom: '6px',
      fontSize: isMobile ? '13px' : '14px',
      fontWeight: '500',
      color: '#374151'
    },
    required: {
      color: '#dc2626',
      marginLeft: '4px'
    },
    input: {
      width: '100%',
      padding: isMobile ? '10px 12px' : '12px 14px',
      border: '1.5px solid #d1d5db',
      borderRadius: '10px',
      fontSize: isMobile ? '14px' : '15px',
      transition: 'all 0.2s',
      outline: 'none',
      backgroundColor: 'white',
      boxSizing: 'border-box' as const
    },
    textarea: {
      width: '100%',
      padding: isMobile ? '10px 12px' : '12px 14px',
      border: '1.5px solid #d1d5db',
      borderRadius: '10px',
      fontSize: isMobile ? '14px' : '15px',
      resize: 'vertical' as const,
      minHeight: '100px',
      outline: 'none',
      fontFamily: 'inherit',
      boxSizing: 'border-box' as const
    },
    select: {
      width: '100%',
      padding: isMobile ? '10px 12px' : '12px 14px',
      border: '1.5px solid #d1d5db',
      borderRadius: '10px',
      fontSize: isMobile ? '14px' : '15px',
      backgroundColor: 'white',
      outline: 'none',
      cursor: 'pointer',
      boxSizing: 'border-box' as const
    },
    hint: {
      fontSize: isMobile ? '11px' : '12px',
      color: '#6b7280',
      marginTop: '6px'
    },
    categoryContainer: {
      display: 'grid',
      gridTemplateColumns: isMobile ? 'repeat(3, 1fr)' : 'repeat(4, 1fr)',
      gap: '8px',
      marginBottom: '15px'
    },
    categoryButton: (category: string, isSelected: boolean) => ({
      padding: isMobile ? '8px' : '10px',
      background: isSelected ? '#3b82f6' : '#f3f4f6',
      color: isSelected ? 'white' : '#374151',
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer',
      fontSize: isMobile ? '11px' : '13px',
      fontWeight: '500',
      transition: 'all 0.2s'
    }),
    dropdown: {
      position: 'absolute' as const,
      top: '100%',
      left: 0,
      right: 0,
      background: 'white',
      border: '1px solid #ddd',
      borderRadius: '8px',
      maxHeight: '200px',
      overflow: 'auto',
      zIndex: 1000,
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
    },
    dropdownItem: {
      padding: isMobile ? '10px' : '12px',
      cursor: 'pointer',
      borderBottom: '1px solid #f0f0f0'
    },
    checkboxContainer: {
      background: '#f0f9ff',
      padding: isMobile ? '12px' : '15px',
      borderRadius: '8px',
      marginBottom: '15px'
    },
    checkbox: {
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      fontSize: isMobile ? '13px' : '14px'
    },
    buttonGroup: {
      display: 'flex',
      gap: '15px',
      justifyContent: 'flex-end',
      marginTop: isMobile ? '25px' : '35px',
      paddingTop: isMobile ? '20px' : '25px',
      borderTop: '2px solid #e5e7eb',
      flexDirection: isMobile ? 'column' as const : 'row' as const
    },
    cancelButton: {
      padding: isMobile ? '12px' : '14px 30px',
      background: '#f3f4f6',
      color: '#374151',
      border: '1px solid #d1d5db',
      borderRadius: '10px',
      fontSize: isMobile ? '14px' : '15px',
      fontWeight: '500',
      cursor: 'pointer',
      transition: 'all 0.2s',
      width: isMobile ? '100%' : 'auto',
      boxSizing: 'border-box' as const
    },
    submitButton: (disabled: boolean) => ({
      padding: isMobile ? '12px' : '14px 35px',
      background: disabled ? '#9ca3af' : '#25D366',
      color: 'white',
      border: 'none',
      borderRadius: '10px',
      fontSize: isMobile ? '14px' : '16px',
      fontWeight: '600',
      cursor: disabled ? 'not-allowed' : 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '10px',
      transition: 'all 0.2s',
      opacity: disabled ? 0.7 : 1,
      width: isMobile ? '100%' : 'auto',
      boxSizing: 'border-box' as const
    }),
    footerNote: {
      marginTop: '20px',
      textAlign: 'center' as const,
      fontSize: isMobile ? '11px' : '13px',
      color: '#6b7280',
      padding: isMobile ? '12px' : '15px',
      background: '#f9fafb',
      borderRadius: '10px'
    },
    loaderContainer: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      flexDirection: 'column' as const,
      gap: '15px'
    },
    loader: {
      width: '40px',
      height: '40px',
      border: '3px solid #f3f3f3',
      borderTop: '3px solid #25D366',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite'
    }
  };

  // Focus handlers
  const handleFocus = (e: any) => {
    e.target.style.borderColor = '#25D366';
    e.target.style.boxShadow = '0 0 0 3px rgba(37, 211, 102, 0.1)';
  };

  const handleBlur = (e: any) => {
    e.target.style.borderColor = '#d1d5db';
    e.target.style.boxShadow = 'none';
  };

  if (loadingCompanies || loadingDevices) {
    return (
      <div style={styles.loaderContainer}>
        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
        <div style={styles.loader}></div>
        <div>Loading data...</div>
        {loadingCompanies && <div style={{ fontSize: '12px', color: '#666' }}>Fetching companies...</div>}
        {loadingDevices && <div style={{ fontSize: '12px', color: '#666' }}>Fetching devices...</div>}
      </div>
    );
  }

  return (
    <>
      <AlertMessage />
      <style jsx>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        input:focus, textarea:focus, select:focus {
          border-color: #25D366 !important;
          box-shadow: 0 0 0 3px rgba(37, 211, 102, 0.1) !important;
        }
        
        * {
          box-sizing: border-box;
        }
      `}</style>

      <div style={styles.container}>
        {/* Header */}
        <div style={styles.header}>
          <span style={styles.headerIcon}>📱</span>
          Create New WhatsApp Ticket
        </div>

        {/* Info Message */}
        <div style={styles.subHeader}>
          <strong>⚡ Important:</strong> After filling the form, WhatsApp will open automatically with pre-filled ticket information. Please fill all details accurately.
        </div>

        {/* Success Message */}
        {ticketGenerated && (
          <div style={styles.successMessage}>
            <span style={styles.successIcon}>✅</span>
            <div style={styles.successTitle}>Ticket Created Successfully!</div>
            <div style={styles.successText}>Your ticket number:</div>
            <div style={styles.ticketNumber}>{ticketNumber}</div>
            <div style={{ marginTop: '15px', fontSize: isMobile ? '12px' : '14px' }}>
              ⏳ Opening WhatsApp... Please wait
            </div>
          </div>
        )}

        {/* Main Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const formData = {
              company: (e.target as any).company.value,
              companyId: '',
              contactName: (e.target as any).contactName.value,
              contactPhone: (e.target as any).contactPhone.value,
              contactEmail: (e.target as any).contactEmail.value,
              device: (e.target as any).device.value,
              problem: (e.target as any).problem.value,
              description: (e.target as any).description.value,
              category: (e.target as any).category.value
            };
            createNewTicket(formData);
          }}
          style={styles.form}
        >
          {/* ===== COMPANY INFORMATION ===== */}
          <div style={styles.section}>
            <div style={styles.sectionTitle}>
              <span>🏢</span> Company Information
            </div>

            {/* Company Search with Dropdown */}
            <div style={{ position: 'relative', marginBottom: '20px' }}>
              <label style={styles.label}>
                Company Name 
              </label>
              <input
                type="text"
                name="company"
                placeholder="Type to search company..."
                value={companySearch}
                onChange={(e) => {
                  setCompanySearch(e.target.value);
                  setShowCompanyDropdown(true);
                }}
                onFocus={(e) => {
                  setShowCompanyDropdown(true);
                  handleFocus(e);
                }}
                onBlur={handleBlur}
                style={styles.input}
                required
              />
              {showCompanyDropdown && companySearch && filteredCompanies.length > 0 && (
                <div style={styles.dropdown}>
                  {filteredCompanies.map(company => (
                    <div
                      key={company.id}
                      onClick={() => {
                        handleCompanySelect(company);
                        (document.querySelector('input[name="company"]') as HTMLInputElement).value = company.name;
                        setShowCompanyDropdown(false);
                      }}
                      style={styles.dropdownItem}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#f3f4f6'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                    >
                      <div style={{ fontWeight: '500', fontSize: isMobile ? '13px' : '14px' }}>{company.name}</div>
                      <div style={{ fontSize: isMobile ? '10px' : '11px', color: '#666' }}>{company.location} - {company.contact}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Contact Person and Phone */}
            <div style={styles.grid2}>
              <div>
                <label style={styles.label}>
                  Contact Person <span style={styles.required}>*</span>
                </label>
                <input
                  type="text"
                  name="contactName"
                  placeholder="Contact Person"
                  required
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                  style={styles.input}
                />
              </div>
              
              <div>
                <label style={styles.label}>
                  Phone Number <span style={styles.required}>*</span>
                </label>
                <input
                  type="tel"
                  name="contactPhone"
                  placeholder="e.g., 919876543210"
                  required
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                  style={styles.input}
                />
                <div style={styles.hint}>With country code (91 for India)</div>
              </div>
            </div>

            {/* Email */}
            <div style={{ marginTop: '15px' }}>
              <label style={styles.label}>
                Email Address <span style={styles.required}>*</span>
              </label>
              <input
                type="email"
                name="contactEmail"
                placeholder="email@example.com"
                required
                onFocus={handleFocus}
                onBlur={handleBlur}
                style={styles.input}
              />
            </div>
          </div>

          {/* ===== DEVICE INFORMATION ===== */}
          <div style={styles.section}>
            <div style={styles.sectionTitle}>
              <span>📱</span> Device Information
            </div>

            {/* Category Selection */}
            <div style={{ marginBottom: '20px' }}>
              <label style={styles.label}>
                Device Category <span style={styles.required}>*</span>
              </label>
              <div style={styles.categoryContainer}>
                {Object.keys(productCatalog).map((category) => (
                  <button
                    key={category}
                    type="button"
                    onClick={() => {
                      handleCategoryChange(category);
                      (document.querySelector('select[name="category"]') as HTMLSelectElement).value = category;
                    }}
                    style={styles.categoryButton(category, selectedCategory === category)}
                  >
                    {category}
                  </button>
                ))}
              </div>
              <select name="category" required style={{ display: 'none' }}>
                <option value="">Select Category</option>
                {Object.keys(productCatalog).map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Product Selection */}
            {selectedCategory && (
              <div style={{ marginBottom: '20px' }}>
                <label style={styles.label}>
                  Select Device/Product <span style={styles.required}>*</span>
                </label>
                <select
                  name="device"
                  required
                  value={selectedProduct}
                  onChange={(e) => setSelectedProduct(e.target.value)}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                  style={styles.select}
                >
                  <option value="">Select {selectedCategory}</option>
                  {filteredProducts.map((product) => (
                    <option key={product} value={product}>{product}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Problem Title */}
            <div style={{ marginBottom: '20px' }}>
              <label style={styles.label}>
                Problem Title <span style={styles.required}>*</span>
              </label>
              <input
                type="text"
                name="problem"
                placeholder="e.g., Device not charging, Screen broken, Slow performance"
                required
                onFocus={handleFocus}
                onBlur={handleBlur}
                style={styles.input}
              />
            </div>
          </div>

          {/* ===== PROBLEM DESCRIPTION ===== */}
          <div style={styles.section}>
            <div style={styles.sectionTitle}>
              <span>📝</span> Problem Description
            </div>

            <div>
              <label style={styles.label}>
                Detailed Description <span style={styles.required}>*</span>
              </label>
              <textarea
                name="description"
                placeholder="Please describe the problem in detail... What happened? When did it start? Any error messages?"
                rows={4}
                required
                onFocus={handleFocus}
                onBlur={handleBlur}
                style={styles.textarea}
              />
            </div>
          </div>

          {/* ===== WHATSAPP NOTIFICATION ===== */}
          <div style={styles.checkboxContainer}>
            <label style={styles.checkbox}>
              <input type="checkbox" defaultChecked />
              <span>Send WhatsApp notification to customer when ticket is created</span>
            </label>
          </div>

          {/* ===== FORM ACTIONS ===== */}
          <div style={styles.buttonGroup}>
            <button
              type="button"
              onClick={() => router.push('/tickets')}
              style={styles.cancelButton}
              onMouseEnter={(e) => e.currentTarget.style.background = '#e5e7eb'}
              onMouseLeave={(e) => e.currentTarget.style.background = '#f3f4f6'}
            >
              Cancel
            </button>
            
            <button
              type="submit"
              disabled={loading}
              style={styles.submitButton(loading)}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.background = '#128C7E';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 8px 20px rgba(37, 211, 102, 0.3)';
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  e.currentTarget.style.background = '#25D366';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }
              }}
            >
              <span style={{ fontSize: isMobile ? '18px' : '20px' }}>📱</span>
              {loading ? 'Creating Ticket...' : 'Create Ticket'}
            </button>
          </div>
        </form>

        {/* Footer Note */}
        <div style={styles.footerNote}>
          <strong>📝 Note:</strong> After creating the ticket, WhatsApp will open automatically. Your ticket will be saved in the database.
        </div>
      </div>
    </>
  );
}
