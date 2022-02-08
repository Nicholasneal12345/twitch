const twitchApiToken = "pky4syvdj6w075a1wjx1btqfnku1ad";
const twitchApiId = "ihjeqjz71u9r6g5qci317ys1fk5v5j";
const limit = 20; // 每次抓取的資料量
let cursor = ""; // 每次抓取資料後會在pagination底下獲取cursor的值，用來做為下一次抓取資料時的位置基準點

// 展示實況圖片、標題、時控主名稱的component
const display = Vue.component("streamsDisplay",{
    template:`
        <div :class = "{display_container: true}">
            <div :class = "{display_item: true}" v-for = "(item, index) in streamsInfo" key = "item.game_id">
                <img :class = "{streams_img: true}" :src = "imgSize(item, 250)">
                <div :class = "{viwer_count: true}">
                    <p>觀眾人數：{{ item.viewer_count }}</p>
                </div>
                <div :class = "{streams_type: true}">
                    <p>{{ item.type }}</p>
                </div>
                <div :class = "{streams_info: true}">
                    <img :class = "{personal_img: true}" :data-setimgsrc = "personalImg(item.user_login, index)"> 
                    <div :class = "{streams_title_and_name: true}">
                        <p :class = "{streams_title: true}">{{ item.title }}</p> 
                        <p :class = "{streams_user_name: true}">{{ item.user_name }}</p> 
                    </div>
                </div>            
            </div>
        </div>
    `,
    props: {
        streamsInfo: {
            type: Array
        }
    },
    methods: {
        // 設定實況圖片要拿取的大小
        imgSize(item, size) {
            return `https://static-cdn.jtvnw.net/previews-ttv/${item.type}_user_${item.user_login}-${size}x${size}.jpg`
        },
        // 拿取個人圖片並且透過原生js操作dom的方式去給予個人圖片連結
        async personalImg(login, index) {
            const personalImgUrl 
                = await fetch(`https://api.twitch.tv/helix/users?login=${login}`, {
                            headers: {
                                "Authorization": `Bearer ${twitchApiToken}`,
                                "Client-Id": twitchApiId
                            }
                        })
                        .then(res => res.json())
                        .then(data => data.data[0].profile_image_url?data.data[0].profile_image_url:data.data[0].offline_image_url);
            
            this.setImg(index, personalImgUrl);
        },
        // 原生js操作dom的方式去給予個人圖片連結
        setImg(index, imgUrl) {
            if(document.querySelectorAll("img.personal_img")[index]) {
                document.querySelectorAll("img.personal_img")[index].setAttribute("src", imgUrl);
            }
        }
    }
});

const vm = new Vue({
    el: "#index_app",
    data() {
        return {
            streamsInfo: []
        }
    },
    template:`
        <streams-display
            :streamsInfo = "streamsInfo"
        />
    `,
    mounted() {
        // 在載入Vue實體完成後使用twitch api拿取目前有在直播的遊戲實況資料共20筆
        // 因為twitch api v5即將在2022年2月底關閉，所以在2021年7月以後將無法使用它而要改用下面這個歸屬於twitch api下拿取live streams資料的api
        fetch(`https://api.twitch.tv/helix/streams?game=League%20of%20Legends&first=${limit}`, {
            headers: {
                "Authorization": `Bearer ${twitchApiToken}`,
                "Client-Id": twitchApiId
            }
        })
        .then(res => res.json())
        .then(data => {
            cursor = data.pagination.cursor;
            this.streamsInfo = data.data;
        });

        this.isTheEndOfBottom();
    },
    methods: {
        // 偵測是否滑到底部，如果滑到底部的畫抓取新的20筆資料並且推進streamsInfo裡
        isTheEndOfBottom() {
            window.addEventListener("scroll", function() {
                // this.innerHeight為目前能看到的畫面高度
                // this.scrollY為目前瀏覽器最上方到目前畫面最上方之間的距離
                // document.querySelector("body").clientHeight為目前整個網頁的高度
                if(this.innerHeight + this.scrollY >= document.querySelector("body").clientHeight) {
                    // first參數為每次要拿幾筆資料，默認值為20，最大值為100
                    // after會從cursor提供的位置往後抓取資料
                    // before會從cursor提供的位置往前抓取資料
                    fetch(`https://api.twitch.tv/helix/streams?game=League%20of%20Legends&first=${limit}&after=${cursor}`, {
                        headers: {
                            "Authorization": `Bearer ${twitchApiToken}`,
                            "Client-Id": twitchApiId
                        }
                    })
                    .then(res => res.json())
                    .then(data => {
                        // 抓取新的cursor
                        cursor = data.pagination.cursor;
                        for(let i = 0; i < data.data.length; i = i + 1) {
                            vm.streamsInfo.push(data.data[i]);
                        }
                    });
                }
            });
        }
    }
})