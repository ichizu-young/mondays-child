class KnittingSearch {
    constructor() {
        this.searchInput = document.getElementById('searchInput');
        this.searchBtn = document.getElementById('searchBtn');
        this.patternSearchInput = document.getElementById('patternSearchInput');
        this.patternSearchBtn = document.getElementById('patternSearchBtn');
        this.loadingDiv = document.getElementById('loadingDiv');
        this.resultsDiv = document.getElementById('resultsDiv');
        this.currentTab = 'technique';
        
        this.bindEvents();
        this.initTabs();
    }
    
    bindEvents() {
        // 기법 검색
        this.searchBtn.addEventListener('click', () => this.handleSearch());
        this.searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.handleSearch();
            }
        });

        // 도안 검색
        this.patternSearchBtn.addEventListener('click', () => this.handlePatternSearch());
        this.patternSearchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.handlePatternSearch();
            }
        });

        // 카테고리 버튼
        document.querySelectorAll('.category-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const category = e.target.getAttribute('data-category');
                this.patternSearchInput.value = category;
                this.handlePatternSearch();
            });
        });
    }

    initTabs() {
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tabName = e.target.getAttribute('data-tab');
                this.switchTab(tabName);
            });
        });
    }

    switchTab(tabName) {
        // 탭 버튼 활성화
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // 탭 내용 활성화
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(`${tabName}-tab`).classList.add('active');

        this.currentTab = tabName;
        this.resultsDiv.innerHTML = ''; // 결과 초기화
    }
    
    async handleSearch() {
        const query = this.searchInput.value.trim();
        if (!query) {
            alert('검색어를 입력해주세요.');
            return;
        }
        
        const needleType = document.querySelector('input[name="needleType"]:checked').value;
        const includeVideos = document.getElementById('includeVideos').checked;
        const includeArticles = document.getElementById('includeArticles').checked;
        
        if (!includeVideos && !includeArticles) {
            alert('최소 하나의 검색 결과 타입을 선택해주세요.');
            return;
        }
        
        this.showLoading(true);
        this.resultsDiv.innerHTML = '';
        
        try {
            const results = await this.searchContent(query, needleType, includeVideos, includeArticles);
            this.displayResults(results);
        } catch (error) {
            console.error('검색 중 오류 발생:', error);
            this.displayError('검색 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
        } finally {
            this.showLoading(false);
        }
    }

    async handlePatternSearch() {
        const query = this.patternSearchInput.value.trim();
        if (!query) {
            alert('찾고 싶은 도안을 입력해주세요.');
            return;
        }

        const needleType = document.querySelector('input[name="patternNeedleType"]:checked').value;

        this.showLoading(true);
        this.resultsDiv.innerHTML = '';

        try {
            const results = await this.searchFreePatterns(query, needleType);
            this.displayResults(results);
        } catch (error) {
            console.error('도안 검색 중 오류 발생:', error);
            this.displayError('도안 검색 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
        } finally {
            this.showLoading(false);
        }
    }
    
    async searchContent(query, needleType, includeVideos, includeArticles) {
        const results = [];
        
        // 실제 뜨개질 콘텐츠 검색
        if (includeVideos) {
            const videoResults = await this.searchKnittingVideos(query, needleType);
            results.push(...videoResults);
        }
        
        if (includeArticles) {
            const articleResults = await this.searchKnittingArticles(query, needleType);
            results.push(...articleResults);
        }
        
        return this.filterAndShuffleResults(results, query);
    }
    
    async searchKnittingVideos(query, needleType) {
        const results = [];
        const needleTypeKor = needleType === 'knitting' ? '대바늘' : '코바늘';
        
        // 한국어 뜨개질 YouTube 검색
        results.push({
            title: `${query} ${needleTypeKor} 뜨기 YouTube 검색`,
            description: `YouTube에서 "${query}" 관련 ${needleTypeKor} 뜨개질 영상을 찾아보세요. 한국 뜨개질 전문가들의 다양한 튜토리얼을 확인할 수 있습니다.`,
            url: `https://www.youtube.com/results?search_query=${encodeURIComponent(query + ' ' + needleTypeKor + ' 뜨개질')}`,
            type: 'video',
            source: 'YouTube'
        });

        // 추가 한국어 검색어로 더 많은 결과
        results.push({
            title: `${needleTypeKor} ${query} 뜨는법 YouTube`,
            description: `"${query} 뜨는법"으로 YouTube에서 검색해보세요. 초보자도 쉽게 따라할 수 있는 상세한 설명 영상들을 찾을 수 있습니다.`,
            url: `https://www.youtube.com/results?search_query=${encodeURIComponent(query + ' 뜨는법 ' + needleTypeKor)}`,
            type: 'video',
            source: 'YouTube'
        });

        return results;
    }
    
    async searchKnittingArticles(query, needleType) {
        const results = [];
        const needleTypeKor = needleType === 'knitting' ? '대바늘' : '코바늘';

        // 한국어 뜨개질 블로그 검색
        results.push({
            title: `${query} ${needleTypeKor} 네이버 블로그`,
            description: `네이버 블로그에서 "${query}" 관련 한국어 뜨개질 가이드와 팁을 확인해보세요. 상세한 사진과 설명이 포함된 포스트들을 찾을 수 있습니다.`,
            url: `https://search.naver.com/search.naver?query=${encodeURIComponent(query + ' ' + needleTypeKor + ' 뜨개질')}`,
            type: 'article',
            source: '네이버 블로그'
        });

        // 다음 블로그 검색
        results.push({
            title: `${query} ${needleTypeKor} 다음 블로그`,
            description: `다음 블로그에서 "${query}" 뜨개질 방법을 찾아보세요. 다양한 블로거들의 경험담과 노하우를 확인할 수 있습니다.`,
            url: `https://search.daum.net/search?q=${encodeURIComponent(query + ' ' + needleTypeKor + ' 뜨개질 블로그')}`,
            type: 'article',
            source: '다음 블로그'
        });

        // 네이버 카페 검색
        results.push({
            title: `${query} ${needleTypeKor} 네이버 카페`,
            description: `네이버 카페에서 "${query}" 관련 뜨개질 커뮤니티 글을 찾아보세요. 회원들간의 질문답변과 작품 공유를 확인할 수 있습니다.`,
            url: `https://search.naver.com/search.naver?where=cafe&query=${encodeURIComponent(query + ' ' + needleTypeKor + ' 뜨개질')}`,
            type: 'article',
            source: '네이버 카페'
        });

        return results;
    }

    async searchFreePatterns(query, needleType) {
        const results = [];
        const needleTypeKor = needleType === 'knitting' ? '대바늘' : '코바늘';
        const needleTypeEng = needleType === 'knitting' ? 'knitting' : 'crochet';

        // 한국어 무료 도안 사이트들
        const koreanPatternSites = [
            {
                name: '네이버 블로그 무료 도안',
                description: `네이버 블로그에서 "${query}" 무료 도안을 찾아보세요. 한국 작가들이 공유하는 다양한 무료 패턴들을 확인할 수 있습니다.`,
                url: `https://search.naver.com/search.naver?query=${encodeURIComponent(query + ' ' + needleTypeKor + ' 무료도안 무료패턴')}`
            },
            {
                name: '다음 블로그 무료 도안',
                description: `다음 블로그에서 "${query}" 관련 무료 도안을 검색해보세요. 상세한 만들기 과정과 함께 제공되는 패턴들을 찾을 수 있습니다.`,
                url: `https://search.daum.net/search?q=${encodeURIComponent(query + ' ' + needleTypeKor + ' 무료도안 패턴')}`
            },
            {
                name: '네이버 카페 도안 공유',
                description: `네이버 카페에서 "${query}" 도안을 공유하는 커뮤니티를 찾아보세요. 회원들끼리 나누는 무료 패턴과 팁들을 확인할 수 있습니다.`,
                url: `https://search.naver.com/search.naver?where=cafe&query=${encodeURIComponent(query + ' ' + needleTypeKor + ' 도안 패턴')}`
            }
        ];

        // 해외 무료 도안 사이트들 (한국어 검색 가능한 사이트들)
        const internationalPatternSites = [
            {
                name: 'Pinterest 무료 도안',
                description: `Pinterest에서 "${query}" 무료 ${needleTypeKor} 패턴을 찾아보세요. 전 세계 작가들의 무료 도안과 아이디어를 확인할 수 있습니다.`,
                url: `https://www.pinterest.com/search/pins/?q=${encodeURIComponent(query + ' free ' + needleTypeEng + ' pattern 무료도안')}`
            },
            {
                name: 'YouTube 무료 도안 튜토리얼',
                description: `YouTube에서 "${query}" 만들기 영상을 찾아보세요. 무료 패턴과 함께 상세한 만들기 과정을 영상으로 확인할 수 있습니다.`,
                url: `https://www.youtube.com/results?search_query=${encodeURIComponent(query + ' ' + needleTypeKor + ' 만들기 무료도안')}`
            }
        ];

        // 결과 조합
        koreanPatternSites.forEach(site => {
            results.push({
                title: `${query} ${needleTypeKor} - ${site.name}`,
                description: site.description,
                url: site.url,
                type: 'pattern',
                source: site.name.replace(' 무료 도안', '').replace(' 무료도안', '')
            });
        });

        internationalPatternSites.forEach(site => {
            results.push({
                title: `${query} ${needleTypeKor} - ${site.name}`,
                description: site.description,
                url: site.url,
                type: 'pattern',
                source: site.name.replace(' 무료 도안', '').replace(' 무료도안', '')
            });
        });

        return results;
    }
    
    
    displayResults(results) {
        if (results.length === 0) {
            this.resultsDiv.innerHTML = `
                <div class="no-results">
                    <p>검색 결과가 없습니다. 다른 검색어로 시도해보세요.</p>
                </div>
            `;
            return;
        }
        
        this.resultsDiv.innerHTML = results.map((result, index) => `
            <a href="${result.url}" target="_blank" class="result-link">
                <div class="result-item ${result.type}" data-index="${index}">
                    <div class="result-content">
                        <div class="result-header">
                            <span class="result-type-icon">
                                ${result.type === 'video' ? '▶️' : result.type === 'pattern' ? '📋' : '📝'}
                            </span>
                            <span class="result-type-badge ${result.type}">
                                ${result.type === 'video' ? '동영상' : result.type === 'pattern' ? '무료도안' : '글/블로그'}
                            </span>
                        </div>
                        <h3 class="result-title">${result.title}</h3>
                        <p class="result-description">${result.description}</p>
                        <div class="result-meta">
                            <span class="result-source">${result.source}</span>
                        </div>
                    </div>
                </div>
            </a>
        `).join('');
    }
    
    displayError(message) {
        this.resultsDiv.innerHTML = `
            <div class="no-results">
                <p>${message}</p>
            </div>
        `;
    }
    
    showLoading(show) {
        this.loadingDiv.classList.toggle('hidden', !show);
    }
    
    findBestMatch(query, keywords) {
        const lowerQuery = query.toLowerCase();
        
        for (const keyword of keywords) {
            if (keyword === 'default') continue;
            if (lowerQuery.includes(keyword.toLowerCase()) || keyword.toLowerCase().includes(lowerQuery)) {
                return keyword;
            }
        }
        
        // 한국어-영어 매핑
        const mapping = {
            'M1': ['늘림', '증가', 'make', 'm1'],
            '메리야스': ['stockinette', '겉뜨기', '안뜨기'],
            '케이블': ['cable', '아란', '꽈배기'],
            '사슬뜨기': ['chain', '체인', 'ch'],
            '그래니스퀘어': ['granny', 'square', '꽃모티브', '모티브']
        };
        
        for (const [key, aliases] of Object.entries(mapping)) {
            if (keywords.includes(key)) {
                for (const alias of aliases) {
                    if (lowerQuery.includes(alias.toLowerCase())) {
                        return key;
                    }
                }
            }
        }
        
        return 'default';
    }
    
    filterAndShuffleResults(results, query) {
        // 검색어와 관련성 높은 결과들을 우선 표시
        const filtered = results.filter(result => {
            const titleLower = result.title.toLowerCase();
            const descLower = result.description.toLowerCase();
            const queryLower = query.toLowerCase();
            
            return titleLower.includes(queryLower) || 
                   descLower.includes(queryLower) ||
                   this.hasRelevantKeywords(result, query);
        });
        
        return filtered.length > 0 ? this.shuffleArray(filtered) : this.shuffleArray(results);
    }
    
    hasRelevantKeywords(result, query) {
        const keywords = {
            'M1': ['늘림', '증가', 'increase', 'make'],
            '메리야스': ['stockinette', 'knit', 'purl'],
            '케이블': ['cable', 'twist', '꽈배기'],
            '사슬': ['chain', 'ch'],
            '그래니': ['granny', 'motif', '모티브']
        };
        
        const queryLower = query.toLowerCase();
        const titleLower = result.title.toLowerCase();
        
        for (const [key, aliases] of Object.entries(keywords)) {
            if (queryLower.includes(key.toLowerCase())) {
                return aliases.some(alias => titleLower.includes(alias.toLowerCase()));
            }
        }
        
        return false;
    }
    
    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new KnittingSearch();
    
    const exampleTerms = ['메리야스뜨기', '코뜨기', '겉뜨기', '아란무늬', '케이블무늬', '리브뜨기'];
    const randomTerm = exampleTerms[Math.floor(Math.random() * exampleTerms.length)];
    document.getElementById('searchInput').placeholder = `검색할 뜨개질 기법이나 패턴을 입력하세요 (예: ${randomTerm})`;
});