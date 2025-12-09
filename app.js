// 2chスレッド風・論破レスバAIゲーム

class ThreadBattleAI {
    constructor() {
        this.postNumber = 0;
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

    generateResponse(userPost) {
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
            const response = this.createResponse(userPost, resident, style, i, numResponses);
            responses.push(response);
        }
        
        return responses;
    }

    createResponse(userPost, resident, style, index, total) {
        const responses = [];
        
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
            `お前の頭大丈夫？ｗ`
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
            `それって相関と因果の混同じゃね？`
        ];
        
        // 皮肉パターン
        const sarcasticPatterns = [
            `すごいなぁ、お前の頭の悪さｗ`,
            `まぁそういう考え方もあるよね（白目）`,
            `お前の世界では正しいのかもしれん`,
            `それはそれで面白い意見だなｗ`,
            `なるほど、お前はそう思うのか（察し）`,
            `お前の尺度で測ってるだけじゃね？`
        ];
        
        // 住民同士の揉め演出
        const conflictPatterns = [
            `>>${this.postNumber + index} お前も大概だろｗ`,
            `>>${this.postNumber + index} それ言える立場？`,
            `>>${this.postNumber + index} お前の方が論点ずらしてるじゃん`,
            `>>${this.postNumber + index} お前も一緒に論破されろよｗ`
        ];
        
        let responseText = '';
        
        // 最初のレスは直接ユーザーへのツッコミ
        if (index === 0) {
            if (style.aggressive > 0.7) {
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
            if (rand < 0.3) {
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
                `>>${this.postNumber} の理論、破綻しすぎて草`
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

    addPost(resident, content, isUser = false) {
        this.postNumber++;
        const postDiv = document.createElement('div');
        postDiv.className = `post ${isUser ? 'user-post' : 'ai-post'}`;
        
        const headerDiv = document.createElement('div');
        headerDiv.className = 'post-header';
        
        const numberSpan = document.createElement('span');
        numberSpan.className = 'post-number';
        numberSpan.textContent = `${this.postNumber} ：`;
        
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
        contentDiv.textContent = content;
        
        postDiv.appendChild(headerDiv);
        postDiv.appendChild(contentDiv);
        
        const threadContent = document.getElementById('threadContent');
        threadContent.appendChild(postDiv);
        
        // スクロールを最下部に
        postDiv.scrollIntoView({ behavior: 'smooth', block: 'end' });
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
        loadingDiv.textContent = '...';
        document.getElementById('threadContent').appendChild(loadingDiv);
        
        // 少し遅延を入れて自然な感じに
        await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));
        
        // ローディングを削除
        loadingDiv.remove();
        
        // AI住民のレスを生成
        const responses = this.generateResponse(userPost);
        
        // レスを順番に追加（少し間隔を空けて）
        for (let i = 0; i < responses.length; i++) {
            await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 500));
            this.addPost(responses[i].resident, responses[i].content);
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

