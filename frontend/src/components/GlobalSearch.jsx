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
    // ✅ PERFORM SEARCH - HANDLES BOTH ARRAY AND OBJECT RESPONSES
    // ============================================================
    const performSearch = async (searchQuery) => {
        console.log('🔍 Searching for:', searchQuery);
        
        try {
            const response = await api.get(`/search?q=${encodeURIComponent(searchQuery)}`);
            console.log('📥 Search Response:', response.data);
            
            // ✅ Your backend returns: { success: true, results: {...}, total: 5 }
            const rawResults = response.data.results || {};
            console.log('📊 Raw Results:', rawResults);
            
            // ✅ Check if results is an array or object
            let resultsData = {};
            
            if (Array.isArray(rawResults)) {
                // If it's an array, convert to object
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
                // It's already an object
                resultsData = rawResults;
                console.log('📊 Results is an object, using as-is');
            }
            
            console.log('📊 Processed Results:', resultsData);
            
            // ✅ Log counts for each category
            console.log('📊 Results Breakdown:');
            console.log(`   🏥 Hospitals: ${resultsData.hospitals?.length || 0}`);
            console.log(`   🛠️ Equipment: ${resultsData.equipment?.length || 0}`);
            console.log(`   ❌ Errors: ${resultsData.errors?.length || 0}`);
            console.log(`   🔧 Repairs: ${resultsData.repairs?.length || 0}`);
            console.log(`   📚 Knowledge: ${resultsData.knowledge?.length || 0}`);
            console.log(`   🔩 Spare Parts: ${resultsData.spareParts?.length || 0}`);
            console.log(`   👤 Users: ${resultsData.users?.length || 0}`);
            
            // ✅ Apply fuzzy search
            const fuzzyResults = {
                hospitals: smartSearch(searchQuery, resultsData.hospitals || []),
                equipment: smartSearch(searchQuery, resultsData.equipment || []),
                errors: smartSearch(searchQuery, resultsData.errors || []),
                repairs: smartSearch(searchQuery, resultsData.repairs || []),
                knowledge: smartSearch(searchQuery, resultsData.knowledge || []),
                spareParts: smartSearch(searchQuery, resultsData.spareParts || []),
                users: smartSearch(searchQuery, resultsData.users || [])
            };
            
            console.log('📊 Fuzzy Results:', fuzzyResults);
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
            hospital: <LocalHospital sx={{ color: '#0B5FA5' }} />,
            hospitals: <LocalHospital sx={{ color: '#0B5FA5' }} />,
            equipment: <MedicalServices sx={{ color: '#28a745' }} />,
            error: <ErrorIcon sx={{ color: '#dc3545' }} />,
            errors: <ErrorIcon sx={{ color: '#dc3545' }} />,
            repair: <Build sx={{ color: '#fd7e14' }} />,
            repairs: <Build sx={{ color: '#fd7e14' }} />,
            knowledge: <Description sx={{ color: '#6f42c1' }} />,
            'knowledge-base': <Description sx={{ color: '#6f42c1' }} />,
            sparePart: <Inventory sx={{ color: '#17a2b8' }} />,
            spareParts: <Inventory sx={{ color: '#17a2b8' }} />,
            'spare-parts': <Inventory sx={{ color: '#17a2b8' }} />,
            user: <Person sx={{ color: '#6c757d' }} />,
            users: <Person sx={{ color: '#6c757d' }} />
        }
        return icons[type] || <Description />
    }

    const getStatusColor = (status) => {
        if (!status) return 'default'
        const colors = {
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
            'Received': 'success'
        }
        return colors[status] || 'default'
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
                <strong style={{ color: '#0B5FA5' }}>
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
                    <Search sx={{ fontSize: 48, color: '#6c757d', mb: 2 }} />
                    <Typography variant="h6" color="textSecondary">
                        No results found
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                        Try searching with different keywords
                    </Typography>
                </Box>
            )
        }

        return (
            <Box>
                <Box sx={{ px: 2, py: 1, bgcolor: '#e3f2fd', display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Search sx={{ fontSize: 16, color: '#0B5FA5' }} />
                    <Typography variant="caption" sx={{ color: '#0B5FA5' }}>
                        Results for "{query}"
                        <Chip 
                            label={`${Object.values(results).reduce((sum, arr) => sum + arr.length, 0)}`}
                            size="small"
                            sx={{ ml: 1, fontSize: '10px', height: 20 }}
                        />
                    </Typography>
                </Box>

                {sections.map((section, index) => {
                    const items = results[section.key] || []
                    if (items.length === 0) return null

                    return (
                        <Box key={section.key}>
                            {index > 0 && <Divider />}
                            <Box sx={{ px: 2, py: 1, bgcolor: '#f8f9fa' }}>
                                <Typography variant="caption" sx={{ color: '#6c757d', fontWeight: 600 }}>
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
                                            '&:hover': { bgcolor: '#f5f5f5' },
                                            borderBottom: '1px solid #f0f0f0'
                                        }}
                                    >
                                        <ListItemIcon>
                                            <Avatar sx={{ bgcolor: '#f0f7ff', width: 32, height: 32 }}>
                                                {getIcon(section.type)}
                                            </Avatar>
                                        </ListItemIcon>
                                        <ListItemText
                                            primary={
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                                                    <Typography variant="body2" fontWeight={500}>
                                                        {getHighlightedText(name, query)}
                                                    </Typography>
                                                    {item.status && (
                                                        <Chip 
                                                            label={item.status} 
                                                            size="small" 
                                                            sx={{ fontSize: '10px', height: 18 }}
                                                            color={getStatusColor(item.status)}
                                                        />
                                                    )}
                                                    {item.priority && (
                                                        <Chip 
                                                            label={item.priority} 
                                                            size="small" 
                                                            sx={{ fontSize: '10px', height: 18 }}
                                                            color={item.priority === 'Critical' ? 'error' : item.priority === 'High' ? 'warning' : 'default'}
                                                        />
                                                    )}
                                                    {item.severity && (
                                                        <Chip 
                                                            label={item.severity} 
                                                            size="small" 
                                                            sx={{ fontSize: '10px', height: 18 }}
                                                            color={item.severity === 'Critical' ? 'error' : item.severity === 'High' ? 'warning' : 'default'}
                                                        />
                                                    )}
                                                </Box>
                                            }
                                            secondary={
                                                <Typography variant="caption" color="textSecondary">
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
                            bgcolor: '#f8f9fa',
                            '& fieldset': {
                                borderColor: '#e9ecef'
                            },
                            '&:hover fieldset': {
                                borderColor: '#0B5FA5'
                            },
                            '&.Mui-focused fieldset': {
                                borderColor: '#0B5FA5'
                            }
                        }
                    }}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <Search sx={{ color: '#6c757d', fontSize: 20 }} />
                            </InputAdornment>
                        ),
                        endAdornment: (
                            <InputAdornment position="end">
                                {loading && <CircularProgress size={18} />}
                                {query && !loading && (
                                    <IconButton size="small" onClick={handleClear} sx={{ p: 0.5 }}>
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
                            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                            '&::-webkit-scrollbar': {
                                width: '6px'
                            },
                            '&::-webkit-scrollbar-track': {
                                bgcolor: '#f1f1f1',
                                borderRadius: '3px'
                            },
                            '&::-webkit-scrollbar-thumb': {
                                bgcolor: '#c1c1c1',
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