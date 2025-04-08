import Fuse from 'fuse.js'
import { useMemo } from 'react'
import { highlight } from '../components/history/HistoryView'

interface SearchableModel {
    id: string
    html: string
}

export function useModelSearch(modelIds: string[], searchTerm: string) {
    const searchableItems = useMemo(() => {
        return modelIds.map((id) => ({
            id,
            html: id,
        }))
    }, [modelIds])

    const fuse = useMemo(() => {
        return new Fuse(searchableItems, {
            keys: ['html'],
            threshold: 0.6,
            shouldSort: true,
            isCaseSensitive: false,
            ignoreLocation: false,
            includeMatches: true,
            minMatchCharLength: 1,
        })
    }, [searchableItems])

    const modelSearchResults = useMemo(() => {
        let results: SearchableModel[] = searchTerm
            ? highlight(fuse.search(searchTerm), 'model-item-highlight')
            : searchableItems
        return results
    }, [searchableItems, searchTerm, fuse])

    return {
        modelSearchResults,
        hasResults: modelSearchResults.length > 0,
        hasExactMatch: modelIds.some(id => id.toLowerCase() === searchTerm.toLowerCase())
    }
} 