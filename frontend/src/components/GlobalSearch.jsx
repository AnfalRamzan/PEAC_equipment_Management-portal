// src/components/GlobalSearch.jsx
// ✅ PAEC THEME - Green & Gold Colors

import React, { useState, useEffect, useRef } from 'react'
import {
    Box,
    TextField,
    InputAdornment,
    Paper,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    Typography,
    Chip,
    CircularProgress,
    Divider,
    IconButton,
    ClickAwayListener,
    Fade,
    Avatar
} from '@mui/material'
import {
    Search,
    Close,
    LocalHospital,
    MedicalServices,
    Error as ErrorIcon,
    Build,
    Description,
    Inventory,
    Person,
    Clear
} from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'

// ============================================================
// ✅ PAEC THEME COLORS
// ============================================================
const colors = {
    sidebar: '#01411C',
    sidebarHover: '#0B542B',
    active: '#0E6335',
    accentGold: '#C9A227',
    goldLight: '#E8C84A',
    text: '#FFFFFF',
    secondaryText: '#B8C8BE',
    mainBg: '#F0F2F5',
    white: '#FFFFFF',
    darkText: '#1A2A3A',
    lightText: '#5A7A8A',
    error: '#D32F2F',
    success: '#2E7D32',
    warning: '#ED6C02',
    info: '#0B5FA5',
    borderColor: 'rgba(1, 65, 28, 0.08)',
    shadowColor: 'rgba(1, 65, 28, 0.08)',
    cardBg: '#FFFFFF',
}

// ============================================================
// ✅ FUZZY SEARCH HELPER
// ============================================================
const smartSearch = (query, data) => {
    if (!query || query.length < 2) return data
    
    const queryLower = query.toLowerCase().trim()
    const words = queryLower.split(' ')
    
    return data.filter(item => {
        const searchableFields = [
            item.name,
            item.model,
            item.manufacturer,
            item.error_title,
            item.error_code,
            item.root_cause,
            item.part_name,
            item.part_number,
            item.brand,
            item.full_name,
            item.email,
            item.hospital_name,
            item.city
        ].filter(Boolean).map(f => f.toLowerCase())
        
        return words.some(word => {
            return searchableFields.some(field => {
                if (field.includes(word)) return true
                
                let matches = 0
                let wordIndex = 0
                for (let i = 0; i < field.length && wordIndex < word.length; i++) {
                    if (field[i] === word[wordIndex]) {
                        matches++
                        wordIndex++
                    }
                }
                const matchPercentage = word.length > 0 ? matches / word.length : 0
                return matchPercentage >= 0.7
            })
        })
    })
}

const GlobalSearch = () => {
    const [query, setQuery] = useState('')
    const [results, setResults] = useState(null)
    const [loading, setLoading] = useState(false)
    const [open, setOpen] = useState(false)
    const searchRef = useRef(null)
    const navigate = useNavigate()
    const inputRef = useRef(null)
    const debounceTimer = useRef(null)

    // ✅ REAL-TIME SEARCH with debounce
    useEffect(() => {
        if (debounceTimer.current) {
            clearTimeout(debounceTimer.current)
        }

        if (!query || query.trim().length === 0) {
            setResults(null)
            setOpen(false)
            setLoading(false)
            return
        }

        if (query.trim().length < 2) {
            setLoading(false)
            setOpen(false)
            return
        }

        setLoading(true)
        debounceTimer.current = setTimeout(() => {
            performSearch(query.trim())
        }, 300)

        return () => {
            if (debounceTimer.current) {
                clearTimeout(debounceTimer.current)
            }
        }
    }, [query])

    // ============================================================
    // ✅ PERFORM SEARCH
    // ============================================================
    const performSearch = async (searchQuery) => {
        console.log('🔍 Searching for:', searchQuery);
        
        try {
            const response = await api.get(`/search?q=${encodeURIComponent(searchQuery)}`);
            console.log('📥 Search Response:', response.data);
            
            const rawResults = response.data.results || {};
            console.log('📊 Raw Results:', rawResults);
            
            let resultsData = {};
            
            if (Array.isArray(rawResults)) {
                console.log('📊 Results is an array, converting...');
                resultsData = {
                    hospitals: rawResults.filter(r => r.type === 'hospital' || r.type === 'hospitals'),
                    equipment: rawResults.filter(r => r.type === 'equipment'),
                    errors: rawResults.filter(r => r.type === 'error' || r.type === 'errors'),
                    repairs: rawResults.filter(r => r.type === 'repair' || r.type === 'repairs'),
                    knowledge: rawResults.filter(r => r.type === 'knowledge' || r.type === 'knowledge-base'),
                    spareParts: rawResults.filter(r => r.type === 'sparePart' || r.type === 'spareParts' || r.type === 'spare-parts'),
                    users: rawResults.filter(r => r.type === 'user' || r.type === 'users')
                };
            } else {
                resultsData = rawResults;
                console.log('📊 Results is an object, using as-is');
            }
            
            console.log('📊 Results Breakdown:');
            console.log(`   🏥 Hospitals: ${resultsData.hospitals?.length || 0}`);
            console.log(`   🛠️ Equipment: ${resultsData.equipment?.length || 0}`);
            console.log(`   ❌ Errors: ${resultsData.errors?.length || 0}`);
            console.log(`   🔧 Repairs: ${resultsData.repairs?.length || 0}`);
            console.log(`   📚 Knowledge: ${resultsData.knowledge?.length || 0}`);
            console.log(`   🔩 Spare Parts: ${resultsData.spareParts?.length || 0}`);
            console.log(`   👤 Users: ${resultsData.users?.length || 0}`);
            
            const fuzzyResults = {
                hospitals: smartSearch(searchQuery, resultsData.hospitals || []),
                equipment: smartSearch(searchQuery, resultsData.equipment || []),
                errors: smartSearch(searchQuery, resultsData.errors || []),
                repairs: smartSearch(searchQuery, resultsData.repairs || []),
                knowledge: smartSearch(searchQuery, resultsData.knowledge || []),
                spareParts: smartSearch(searchQuery, resultsData.spareParts || []),
                users: smartSearch(searchQuery, resultsData.users || [])
            };
            
            console.log('📊 Total Fuzzy Results:', 
                (fuzzyResults.hospitals?.length || 0) +
                (fuzzyResults.equipment?.length || 0) +
                (fuzzyResults.errors?.length || 0) +
                (fuzzyResults.repairs?.length || 0) +
                (fuzzyResults.knowledge?.length || 0) +
                (fuzzyResults.spareParts?.length || 0) +
                (fuzzyResults.users?.length || 0)
            );
            
            setResults(fuzzyResults);
            setOpen(true);
        } catch (error) {
            console.error('❌ Search error:', error);
            console.error('❌ Error details:', error.response?.data || error.message);
        } finally {
            setLoading(false);
        }
    }

    const handleInputChange = (e) => {
        const value = e.target.value
        setQuery(value)
        
        if (value.trim().length >= 2) {
            setOpen(true)
        } else {
            setOpen(false)
            setResults(null)
        }
    }

    const handleResultClick = (type, id) => {
        setOpen(false)
        setQuery('')
        setResults(null)
        
        const paths = {
            hospital: '/hospitals',
            hospitals: '/hospitals',
            equipment: '/equipment',
            error: '/errors',
            errors: '/errors',
            repair: '/repairs',
            repairs: '/repairs',
            knowledge: '/knowledge-base',
            'knowledge-base': '/knowledge-base',
            sparePart: '/spare-parts',
            spareParts: '/spare-parts',
            'spare-parts': '/spare-parts',
            user: '/users',
            users: '/users'
        }
        
        const path = paths[type]
        if (path) {
            navigate(`${path}?id=${id}`)
        }
    }

    const handleClear = () => {
        setQuery('')
        setResults(null)
        setOpen(false)
        if (inputRef.current) {
            inputRef.current.focus()
        }
    }

    const getIcon = (type) => {
        const icons = {
            hospital: <LocalHospital sx={{ color: colors.sidebar }} />,
            hospitals: <LocalHospital sx={{ color: colors.sidebar }} />,
            equipment: <MedicalServices sx={{ color: colors.success }} />,
            error: <ErrorIcon sx={{ color: colors.error }} />,
            errors: <ErrorIcon sx={{ color: colors.error }} />,
            repair: <Build sx={{ color: colors.warning }} />,
            repairs: <Build sx={{ color: colors.warning }} />,
            knowledge: <Description sx={{ color: colors.info }} />,
            'knowledge-base': <Description sx={{ color: colors.info }} />,
            sparePart: <Inventory sx={{ color: colors.sidebar }} />,
            spareParts: <Inventory sx={{ color: colors.sidebar }} />,
            'spare-parts': <Inventory sx={{ color: colors.sidebar }} />,
            user: <Person sx={{ color: colors.lightText }} />,
            users: <Person sx={{ color: colors.lightText }} />
        }
        return icons[type] || <Description />
    }

    const getStatusColor = (status) => {
        if (!status) return 'default'
        const colorsMap = {
            'Active': 'success',
            'Inactive': 'error',
            'Pending': 'warning',
            'Resolved': 'success',
            'Closed': 'default',
            'In Progress': 'info',
            'Completed': 'success',
            'Approved': 'success',
            'Rejected': 'error',
            'Scheduled': 'info',
            'Overdue': 'error',
            'Retired': 'default',
            'Draft': 'default',
            'Ordered': 'info',
            'Received': 'success',
            'Critical': 'error',
            'High': 'warning',
            'Medium': 'info',
            'Low': 'success'
        }
        return colorsMap[status] || 'default'
    }

    const getHighlightedText = (text, query) => {
        if (!text || !query) return text
        const lowerText = text.toLowerCase()
        const lowerQuery = query.toLowerCase()
        const index = lowerText.indexOf(lowerQuery)
        if (index === -1) return text
        
        return (
            <>
                {text.substring(0, index)}
                <strong style={{ color: colors.sidebar }}>
                    {text.substring(index, index + query.length)}
                </strong>
                {text.substring(index + query.length)}
            </>
        )
    }

    const renderResults = () => {
        if (!results) return null

        const sections = [
            { key: 'hospitals', label: '🏥 Hospitals', type: 'hospital', nameField: 'name' },
            { key: 'equipment', label: '🛠️ Equipment', type: 'equipment', nameField: 'name' },
            { key: 'errors', label: '❌ Errors', type: 'error', nameField: 'error_title' },
            { key: 'repairs', label: '🔧 Repairs', type: 'repair', nameField: 'root_cause' },
            { key: 'knowledge', label: '📚 Knowledge Base', type: 'knowledge', nameField: 'error_title' },
            { key: 'spareParts', label: '🔩 Spare Parts', type: 'sparePart', nameField: 'part_name' },
            { key: 'users', label: '👤 Users', type: 'user', nameField: 'full_name' }
        ]

        const hasResults = sections.some(s => results[s.key]?.length > 0)

        if (!hasResults) {
            return (
                <Box sx={{ p: 4, textAlign: 'center' }}>
                    <Search sx={{ fontSize: 48, color: colors.lightText, mb: 2 }} />
                    <Typography variant="h6" sx={{ color: colors.lightText }}>
                        No results found
                    </Typography>
                    <Typography variant="body2" sx={{ color: colors.lightText }}>
                        Try searching with different keywords
                    </Typography>
                </Box>
            )
        }

        return (
            <Box>
                <Box sx={{ 
                    px: 2, 
                    py: 1, 
                    bgcolor: `${colors.sidebar}08`, 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 1,
                    borderBottom: `1px solid ${colors.borderColor}`
                }}>
                    <Search sx={{ fontSize: 16, color: colors.sidebar }} />
                    <Typography variant="caption" sx={{ color: colors.sidebar }}>
                        Results for "{query}"
                        <Chip 
                            label={`${Object.values(results).reduce((sum, arr) => sum + arr.length, 0)}`}
                            size="small"
                            sx={{ 
                                ml: 1, 
                                fontSize: '10px', 
                                height: 20,
                                bgcolor: colors.sidebar,
                                color: 'white'
                            }}
                        />
                    </Typography>
                </Box>

                {sections.map((section, index) => {
                    const items = results[section.key] || []
                    if (items.length === 0) return null

                    return (
                        <Box key={section.key}>
                            {index > 0 && <Divider sx={{ borderColor: colors.borderColor }} />}
                            <Box sx={{ px: 2, py: 1, bgcolor: colors.mainBg }}>
                                <Typography variant="caption" sx={{ color: colors.lightText, fontWeight: 600 }}>
                                    {section.label} ({items.length})
                                </Typography>
                            </Box>
                            {items.map((item, idx) => {
                                const name = item[section.nameField] || item.name || item.full_name || 'Untitled'
                                const subtitle = item.hospital_name || item.equipment_name || item.city || item.email || item.model || item.part_number || item.role_name || ''
                                
                                return (
                                    <ListItem
                                        key={idx}
                                        button
                                        onClick={() => handleResultClick(section.type, item.id)}
                                        sx={{ 
                                            '&:hover': { bgcolor: `${colors.sidebar}06` },
                                            borderBottom: `1px solid ${colors.borderColor}`
                                        }}
                                    >
                                        <ListItemIcon>
                                            <Avatar sx={{ 
                                                bgcolor: `${colors.sidebar}10`, 
                                                width: 32, 
                                                height: 32,
                                                color: colors.sidebar
                                            }}>
                                                {getIcon(section.type)}
                                            </Avatar>
                                        </ListItemIcon>
                                        <ListItemText
                                            primary={
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                                                    <Typography variant="body2" fontWeight={500} sx={{ color: colors.darkText }}>
                                                        {getHighlightedText(name, query)}
                                                    </Typography>
                                                    {item.status && (
                                                        <Chip 
                                                            label={item.status} 
                                                            size="small" 
                                                            sx={{ 
                                                                fontSize: '10px', 
                                                                height: 18,
                                                                bgcolor: getStatusColor(item.status) === 'success' ? colors.success :
                                                                        getStatusColor(item.status) === 'error' ? colors.error :
                                                                        getStatusColor(item.status) === 'warning' ? colors.warning :
                                                                        getStatusColor(item.status) === 'info' ? colors.info :
                                                                        '#e0e0e0',
                                                                color: 'white'
                                                            }}
                                                        />
                                                    )}
                                                    {item.priority && (
                                                        <Chip 
                                                            label={item.priority} 
                                                            size="small" 
                                                            sx={{ 
                                                                fontSize: '10px', 
                                                                height: 18,
                                                                bgcolor: item.priority === 'Critical' ? colors.error : 
                                                                        item.priority === 'High' ? colors.warning : 
                                                                        colors.sidebar,
                                                                color: 'white'
                                                            }}
                                                        />
                                                    )}
                                                    {item.severity && (
                                                        <Chip 
                                                            label={item.severity} 
                                                            size="small" 
                                                            sx={{ 
                                                                fontSize: '10px', 
                                                                height: 18,
                                                                bgcolor: item.severity === 'Critical' ? colors.error : 
                                                                        item.severity === 'High' ? colors.warning : 
                                                                        colors.sidebar,
                                                                color: 'white'
                                                            }}
                                                        />
                                                    )}
                                                </Box>
                                            }
                                            secondary={
                                                <Typography variant="caption" sx={{ color: colors.lightText }}>
                                                    {subtitle}
                                                    {item.manufacturer && ` • ${item.manufacturer}`}
                                                    {item.model && ` • ${item.model}`}
                                                    {item.city && ` • ${item.city}`}
                                                    {item.error_code && ` • ${item.error_code}`}
                                                    {item.part_number && ` • ${item.part_number}`}
                                                    {item.serial_number && ` • SN: ${item.serial_number}`}
                                                </Typography>
                                            }
                                        />
                                    </ListItem>
                                )
                            })}
                        </Box>
                    )
                })}
            </Box>
        )
    }

    return (
        <ClickAwayListener onClickAway={() => setOpen(false)}>
            <Box ref={searchRef} sx={{ position: 'relative', flexGrow: 1, maxWidth: { xs: '100%', sm: 450, md: 550 } }}>
                <TextField
                    inputRef={inputRef}
                    fullWidth
                    size="small"
                    placeholder="Search equipment, hospitals, errors..."
                    value={query}
                    onChange={handleInputChange}
                    onFocus={() => {
                        if (query.trim().length >= 2 && results) {
                            setOpen(true)
                        }
                    }}
                    sx={{
                        '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                            bgcolor: colors.mainBg,
                            '& fieldset': {
                                borderColor: colors.borderColor
                            },
                            '&:hover fieldset': {
                                borderColor: colors.sidebar
                            },
                            '&.Mui-focused fieldset': {
                                borderColor: colors.accentGold,
                                borderWidth: 2
                            }
                        }
                    }}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <Search sx={{ color: colors.lightText, fontSize: 20 }} />
                            </InputAdornment>
                        ),
                        endAdornment: (
                            <InputAdornment position="end">
                                {loading && <CircularProgress size={18} sx={{ color: colors.sidebar }} />}
                                {query && !loading && (
                                    <IconButton 
                                        size="small" 
                                        onClick={handleClear} 
                                        sx={{ 
                                            p: 0.5,
                                            color: colors.lightText,
                                            '&:hover': { color: colors.error }
                                        }}
                                    >
                                        <Clear fontSize="small" />
                                    </IconButton>
                                )}
                            </InputAdornment>
                        )
                    }}
                />

                <Fade in={open && (query.trim().length >= 2)}>
                    <Paper
                        sx={{
                            position: 'absolute',
                            top: '100%',
                            left: 0,
                            right: 0,
                            mt: 1,
                            maxHeight: 450,
                            overflow: 'auto',
                            zIndex: 9999,
                            borderRadius: 2,
                            boxShadow: `0 4px 20px ${colors.shadowColor}`,
                            border: `1px solid ${colors.borderColor}`,
                            '&::-webkit-scrollbar': {
                                width: '6px'
                            },
                            '&::-webkit-scrollbar-track': {
                                bgcolor: colors.mainBg,
                                borderRadius: '3px'
                            },
                            '&::-webkit-scrollbar-thumb': {
                                bgcolor: colors.sidebar,
                                borderRadius: '3px'
                            }
                        }}
                    >
                        {renderResults()}
                    </Paper>
                </Fade>
            </Box>
        </ClickAwayListener>
    )
}

export default GlobalSearch