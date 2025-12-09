// 2chスレッド風・論破レスバAIゲーム

class ThreadBattleAI {
    constructor() {
        this.postNumber = 0;
        this.posts = []; // 投稿を保存
        this.residents = [
            '風吹けば名無し',
            '名無しのゴッキー',
            '名無しさん＠お腹いっぱい',
            '名無しの権兵衛',
            '名無しのインテリ',
            '名無しの一般人'
        ];
        this.residentStyles = [
            { aggressive: 0.8, logical: 0.6, sarcastic: 0.7 },
            { aggressive: 0.6, logical: 0.8, sarcastic: 0.5 },
            { aggressive: 0.5, logical: 0.7, sarcastic: 0.9 },
            { aggressive: 0.7, logical: 0.5, sarcastic: 0.6 },
            { aggressive: 0.4, logical: 0.9, sarcastic: 0.8 },
            { aggressive: 0.6, logical: 0.6, sarcastic: 0.7 }
        ];
        this.init();
    }

    init() {
        const submitBtn = document.getElementById('submitBtn');
        const userInput = document.getElementById('userInput');
        
        submitBtn.addEventListener('click', () => this.handleSubmit());
        userInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && e.ctrlKey) {
                this.handleSubmit();
            }
        });

        // 初期スレタイ生成
        this.generateThreadTitle();
        
        // 初期メッセージ表示
        this.showInitialMessage();
    }
    
    showInitialMessage() {
        const threadContent = document.getElementById('threadContent');
        const emptyDiv = document.createElement('div');
        emptyDiv.className = 'empty-thread';
        emptyDiv.id = 'emptyThread';
        emptyDiv.textContent = 'スレッドがまだ空です。最初の書き込みをどうぞ。';
        threadContent.appendChild(emptyDiv);
    }
    
    updatePostCount() {
        const postCountEl = document.getElementById('postCount');
        if (postCountEl) {
            postCountEl.textContent = this.postNumber;
        }
    }
    
    scrollToPost(postNumber) {
        const postElement = document.querySelector(`[data-post-number="${postNumber}"]`);
        if (postElement) {
            postElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            // ハイライト効果
            postElement.style.backgroundColor = '#1a3a1a';
            setTimeout(() => {
                postElement.style.backgroundColor = '';
            }, 1000);
        }
    }
    
    parseQuotes(text) {
        // >>1 のような引用をリンクに変換
        const quoteRegex = />>(\d+)/g;
        const parts = [];
        let lastIndex = 0;
        let match;
        
        while ((match = quoteRegex.exec(text)) !== null) {
            // 引用の前のテキスト
            if (match.index > lastIndex) {
                parts.push({
                    type: 'text',
                    content: text.substring(lastIndex, match.index)
                });
            }
            // 引用リンク
            parts.push({
                type: 'quote',
                postNumber: parseInt(match[1]),
                content: match[0]
            });
            lastIndex = match.index + match[0].length;
        }
        
        // 残りのテキスト
        if (lastIndex < text.length) {
            parts.push({
                type: 'text',
                content: text.substring(lastIndex)
            });
        }
        
        return parts.length > 0 ? parts : [{ type: 'text', content: text }];
    }

    generateThreadTitle() {
        const titles = [
            '2chスレッド風・論破レスバAIゲーム',
            'お前の主張を論破してやるスレ',
            'どんな話題でも論破するスレ',
            'レスバトルAI vs お前',
            '2ch住民がお前を論破するスレ'
        ];
        const title = titles[Math.floor(Math.random() * titles.length)];
        document.getElementById('threadTitle').textContent = title;
    }

    generateID() {
        const chars = '0123456789abcdef';
        let id = '';
        for (let i = 0; i < 7; i++) {
            id += chars[Math.floor(Math.random() * chars.length)];
        }
        return id;
    }

    getCurrentDateTime() {
        const now = new Date();
        const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const weekday = weekdays[now.getDay()];
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        const milliseconds = String(now.getMilliseconds()).padStart(2, '0').substring(0, 2);
        
        return `${year}/${month}/${day}(${weekday}) ${hours}:${minutes}:${seconds}.${milliseconds}`;
    }

    async generateResponse(userPost) {
        const numResponses = Math.floor(Math.random() * 4) + 3; // 3〜6レス
        const responses = [];
        const usedResidents = new Set();
        
        for (let i = 0; i < numResponses; i++) {
            let residentIndex;
            do {
                residentIndex = Math.floor(Math.random() * this.residents.length);
            } while (usedResidents.size < this.residents.length && usedResidents.has(residentIndex));
            usedResidents.add(residentIndex);
            
            const resident = this.residents[residentIndex];
            const style = this.residentStyles[residentIndex];
            
            // APIを呼び出してレスを生成
            try {
                const response = await this.generateResponseWithAI(userPost, resident, style, i, numResponses);
                responses.push(response);
            } catch (error) {
                console.error('AIレス生成エラー:', error);
                // エラー時はフォールバック
                const fallbackResponse = this.createResponse(userPost, resident, style, i, numResponses);
                responses.push(fallbackResponse);
            }
        }
        
        return responses;
    }
    
    async generateResponseWithAI(userPost, resident, style, index, total) {
        // API URLを決定（Vercel環境かローカルか）
        const apiUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
            ? 'http://localhost:3000/api/generate'
            : '/api/generate';
        
        // 前のレスを取得（住民同士の揉め演出用）
        const previousPosts = this.posts.slice(-3).map(p => ({
            number: p.number,
            resident: p.resident,
            content: p.content
        }));
        
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                userPost: userPost,
                postNumber: this.postNumber,
                residentName: resident,
                residentStyle: style,
                responseIndex: index,
                totalResponses: total,
                previousPosts: previousPosts
            })
        });
        
        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }
        
        const data = await response.json();
        
        return {
            resident: resident,
            content: data.content
        };
    }

    createResponse(userPost, resident, style, index, total) {
        const userPostLower = userPost.toLowerCase();
        const userPostLength = userPost.length;
        
        // 煽りパターン
        const aggressivePatterns = [
            `お前さぁ…本気で言ってんの？ｗ`,
            `それお前の感想だよね？`,
            `はい論破`,
            `その理論破綻してて草`,
            `お前エスパーかよ`,
            `はい矛盾出たｗ`,
            `それってお前の主観じゃん`,
            `ソースは？`,
            `それってつまり何？`,
            `お前の頭大丈夫？ｗ`,
            `それって根拠あるの？`,
            `お前の論理、めちゃくちゃじゃね？`,
            `それって思い込みじゃね？`,
            `お前の主張、支離滅裂すぎて草`
        ];
        
        // 論破パターン
        const logicalPatterns = [
            `それって>>${this.postNumber}の主張と矛盾してない？`,
            `論点ずらしてない？`,
            `具体例出してよ`,
            `データは？`,
            `それって一般化しすぎじゃね？`,
            `例外は考えないの？`,
            `前提が間違ってる気がする`,
            `それって相関と因果の混同じゃね？`,
            `それって論理の飛躍じゃね？`,
            `反証可能性は？`,
            `それって帰納法の誤用じゃね？`,
            `お前の定義、曖昧すぎる`
        ];
        
        // 皮肉パターン
        const sarcasticPatterns = [
            `すごいなぁ、お前の頭の悪さｗ`,
            `まぁそういう考え方もあるよね（白目）`,
            `お前の世界では正しいのかもしれん`,
            `それはそれで面白い意見だなｗ`,
            `なるほど、お前はそう思うのか（察し）`,
            `お前の尺度で測ってるだけじゃね？`,
            `お前の価値観、面白いなｗ`,
            `それはそれで一理ある...わけないだろｗ`
        ];
        
        // ユーザーの投稿内容に応じたレス
        let contextAwarePatterns = [];
        if (userPostLength < 10) {
            contextAwarePatterns.push(`短すぎて何言ってるか分からんｗ`);
            contextAwarePatterns.push(`もっと詳しく説明してよ`);
        } else if (userPostLength > 200) {
            contextAwarePatterns.push(`長文すぎて読む気失せるｗ`);
            contextAwarePatterns.push(`要約してよ`);
        }
        
        if (userPostLower.includes('テレワーク') || userPostLower.includes('リモート')) {
            contextAwarePatterns.push(`テレワークって結局どうなんだよ`);
            contextAwarePatterns.push(`テレワークのメリット・デメリット考えたことある？`);
        }
        if (userPostLower.includes('ai') || userPostLower.includes('人工知能')) {
            contextAwarePatterns.push(`AIって結局人間の方が上だろ`);
            contextAwarePatterns.push(`AIに仕事奪われるとか言ってる時点でお前の価値が分かるｗ`);
        }
        if (userPostLower.includes('終わり') || userPostLower.includes('終了')) {
            contextAwarePatterns.push(`終わりって何が終わりなんだよ`);
            contextAwarePatterns.push(`お前の頭が終わってるだけじゃね？`);
        }
        
        // 住民同士の揉め演出
        const conflictPatterns = [];
        if (this.postNumber > 0) {
            const targetPost = this.postNumber + index;
            conflictPatterns.push(`>>${targetPost} お前も大概だろｗ`);
            conflictPatterns.push(`>>${targetPost} それ言える立場？`);
            conflictPatterns.push(`>>${targetPost} お前の方が論点ずらしてるじゃん`);
            conflictPatterns.push(`>>${targetPost} お前も一緒に論破されろよｗ`);
        }
        
        let responseText = '';
        
        // 最初のレスは直接ユーザーへのツッコミ
        if (index === 0) {
            // コンテキストに応じたレスがあれば優先
            if (contextAwarePatterns.length > 0 && Math.random() > 0.3) {
                responseText = contextAwarePatterns[Math.floor(Math.random() * contextAwarePatterns.length)];
            } else if (style.aggressive > 0.7) {
                responseText = aggressivePatterns[Math.floor(Math.random() * aggressivePatterns.length)];
            } else if (style.logical > 0.7) {
                responseText = logicalPatterns[Math.floor(Math.random() * logicalPatterns.length)];
            } else {
                responseText = sarcasticPatterns[Math.floor(Math.random() * sarcasticPatterns.length)];
            }
        }
        // 中間のレスは住民同士の揉めや別視点
        else if (index < total - 1) {
            const rand = Math.random();
            if (rand < 0.3 && conflictPatterns.length > 0) {
                // 住民同士の揉め
                responseText = conflictPatterns[Math.floor(Math.random() * conflictPatterns.length)];
            } else if (rand < 0.6) {
                // 別視点での論破
                responseText = logicalPatterns[Math.floor(Math.random() * logicalPatterns.length)];
            } else {
                // 煽り
                responseText = aggressivePatterns[Math.floor(Math.random() * aggressivePatterns.length)];
            }
        }
        // 最後のレスはまとめ
        else {
            const summaryPatterns = [
                `結論：>>${this.postNumber} が間違ってる（確信）`,
                `>>${this.postNumber} お前負けだよｗ`,
                `>>${this.postNumber} の主張、完全に論破されたな`,
                `>>${this.postNumber} もう諦めろｗ`,
                `>>${this.postNumber} の理論、破綻しすぎて草`,
                `>>${this.postNumber} の論理、完全に破綻してる（確信）`
            ];
            responseText = summaryPatterns[Math.floor(Math.random() * summaryPatterns.length)];
        }
        
        // ランダムに「ｗ」や「草」を追加
        if (Math.random() > 0.5) {
            const wCount = Math.floor(Math.random() * 5) + 1;
            responseText += 'w'.repeat(wCount);
        }
        if (Math.random() > 0.7) {
            responseText += ' 草';
        }
        
        return {
            resident: resident,
            content: responseText
        };
    }
    
    generateFallbackResponses(userPost) {
        // APIが使えない場合のフォールバック
        const numResponses = Math.floor(Math.random() * 4) + 3;
        const responses = [];
        const usedResidents = new Set();
        
        for (let i = 0; i < numResponses; i++) {
            let residentIndex;
            do {
                residentIndex = Math.floor(Math.random() * this.residents.length);
            } while (usedResidents.size < this.residents.length && usedResidents.has(residentIndex));
            usedResidents.add(residentIndex);
            
            const resident = this.residents[residentIndex];
            const style = this.residentStyles[residentIndex];
            const response = this.createResponse(userPost, resident, style, i, numResponses);
            responses.push(response);
        }
        
        return responses;
    }

    addPost(resident, content, isUser = false) {
        this.postNumber++;
        
        // 空のスレッドメッセージを削除
        const emptyThread = document.getElementById('emptyThread');
        if (emptyThread) {
            emptyThread.remove();
        }
        
        const postDiv = document.createElement('div');
        postDiv.className = `post ${isUser ? 'user-post' : 'ai-post'}`;
        postDiv.setAttribute('data-post-number', this.postNumber);
        
        const headerDiv = document.createElement('div');
        headerDiv.className = 'post-header';
        
        const numberSpan = document.createElement('span');
        numberSpan.className = 'post-number';
        numberSpan.textContent = `${this.postNumber} ：`;
        numberSpan.addEventListener('click', () => {
            // レス番号クリックで引用を入力欄に追加
            const userInput = document.getElementById('userInput');
            const currentValue = userInput.value.trim();
            const quote = `>>${this.postNumber} `;
            userInput.value = currentValue ? `${currentValue}\n${quote}` : quote;
            userInput.focus();
            userInput.setSelectionRange(userInput.value.length, userInput.value.length);
        });
        
        const nameSpan = document.createElement('span');
        nameSpan.className = 'post-name';
        nameSpan.textContent = resident;
        
        const dateSpan = document.createElement('span');
        dateSpan.className = 'post-date';
        dateSpan.textContent = `：${this.getCurrentDateTime()}：`;
        
        const idSpan = document.createElement('span');
        idSpan.className = 'post-id';
        idSpan.textContent = `ID:${this.generateID()}`;
        
        headerDiv.appendChild(numberSpan);
        headerDiv.appendChild(nameSpan);
        headerDiv.appendChild(dateSpan);
        headerDiv.appendChild(idSpan);
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'post-content';
        
        // 引用リンクを処理
        const parts = this.parseQuotes(content);
        parts.forEach(part => {
            if (part.type === 'quote') {
                const quoteLink = document.createElement('span');
                quoteLink.className = 'quote-link';
                quoteLink.textContent = part.content;
                quoteLink.addEventListener('click', () => {
                    this.scrollToPost(part.postNumber);
                });
                contentDiv.appendChild(quoteLink);
            } else {
                const textNode = document.createTextNode(part.content);
                contentDiv.appendChild(textNode);
            }
        });
        
        postDiv.appendChild(headerDiv);
        postDiv.appendChild(contentDiv);
        
        // 投稿を保存
        this.posts.push({
            number: this.postNumber,
            resident: resident,
            content: content,
            isUser: isUser,
            element: postDiv
        });
        
        const threadContent = document.getElementById('threadContent');
        threadContent.appendChild(postDiv);
        
        // レスカウント更新
        this.updatePostCount();
        
        // スクロールを最下部に
        setTimeout(() => {
            postDiv.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }, 100);
    }

    async handleSubmit() {
        const userInput = document.getElementById('userInput');
        const userPost = userInput.value.trim();
        
        if (!userPost) {
            return;
        }
        
        // ユーザーの投稿を追加
        this.addPost('名無しさん', userPost, true);
        
        // 入力欄をクリア
        userInput.value = '';
        
        // ローディング表示
        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'post loading';
        loadingDiv.textContent = 'AIがレスを生成中...';
        document.getElementById('threadContent').appendChild(loadingDiv);
        
        try {
            // AI住民のレスを生成
            const responses = await this.generateResponse(userPost);
            
            // ローディングを削除
            loadingDiv.remove();
            
            // レスを順番に追加（少し間隔を空けて）
            for (let i = 0; i < responses.length; i++) {
                await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));
                this.addPost(responses[i].resident, responses[i].content);
            }
        } catch (error) {
            console.error('レス生成エラー:', error);
            loadingDiv.remove();
            // エラー時はフォールバック
            const fallbackResponses = this.generateFallbackResponses(userPost);
            for (let i = 0; i < fallbackResponses.length; i++) {
                await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 500));
                this.addPost(fallbackResponses[i].resident, fallbackResponses[i].content);
            }
        }
        
        // 1000なら演出
        if (this.postNumber === 1000) {
            setTimeout(() => {
                this.addPost('名無しの管理人', '1000なら>>1が勝つ（確信）', false);
            }, 500);
        }
    }
}

// 初期化
document.addEventListener('DOMContentLoaded', () => {
    const game = new ThreadBattleAI();
    
    // テスト用：最初の投稿があれば実行
    const urlParams = new URLSearchParams(window.location.search);
    const testPost = urlParams.get('test');
    if (testPost) {
        setTimeout(() => {
            document.getElementById('userInput').value = testPost;
            game.handleSubmit();
        }, 1000);
    }
});

