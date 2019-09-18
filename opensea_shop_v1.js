const {
    Parcel
} = require('conlan-cryptovoxels')
const fetch = require('node-fetch')

class AssetContractEntryAnchor {
    constructor(x, z, address) {
        // x,z position of this entry anchor
        this.x = x;
        this.z = z;
        // the asset contract address that we should set the category to when the player enters nearby this entry anchor
        this.address = address;
    }
}

// -----------------------------------------------------------------
// Parameters
// -----------------------------------------------------------------
// Your parcel ID from https://www.cryptovoxels.com/account
let parcel_id = 595

// The IDs of the any cheaper NFT images
let cheap_images = [
    "small-0", "small-1", "small-2", "small-3", "small-4",
    "small-5", "small-6", "small-7", "small-8", "small-9",
    "small-10", "small-11", "small-12", "small-13", "small-14", "small-15", "small-16", "small-17", "small-18", "small-19", "small-20", "small-21"
]
// The IDs of the any expensive NFT images
let expensive_images = [
    "large-0", "large-1", "large-2", "large-3", "large-4",
    "large-5", "large-6", "large-7", "large-8", "large-9",
    "large-10", "large-11"
]
// map of entry coordinates pointing to asset contract asset_contract_address
// when a player enters parcel, the closets entrance point determines the asset_contract_address to use
let coordinate_map = [
    // My crypto heroes
    new AssetContractEntryAnchor(-156, 194, "0xdceaf1652a131f32a821468dc03a92df0edd86ea"),
    // Crypto Space commander
    new AssetContractEntryAnchor(-155, 192, "0x4d3814d4da8083b41861dec2f45b4840e8b72d68"),
    // Decentraland
    new AssetContractEntryAnchor(-155, 190, "0xf87e31492faf9a91b02ee0deaad50d51d56d5d4d"),
    // Cryptokitties
    new AssetContractEntryAnchor(-155, 188, "0x06012c8cf97bead5deae237070f9587f8e7a266d"),
    // cryptovoxels
    new AssetContractEntryAnchor(-155, 186, "0x79986af15539de2db9a5086382daeda917a9cf0c"),
    // Cryptospells
    new AssetContractEntryAnchor(-155, 184, "0x67cbbb366a51fff9ad869d027e496ba49f5f6d55"),
    // blockchain cuties
    new AssetContractEntryAnchor(-154.5, 182.25, "0xd73be539d6b2076bab83ca6ba62dfe189abc6bbe"),
    // Maker's place
    new AssetContractEntryAnchor(-152.5, 182.25, "0x2a46f2ffd99e19a89476e2f62270e0a35bbf0756"),
    // 0xuniverse
    new AssetContractEntryAnchor(-150.5, 182.25, "0x06a6a7af298129e3a2ab396c9c06f91d3c54aba8"),
    // Axie
    new AssetContractEntryAnchor(-148.5, 182.25, "0xf5b0a3efb8e8e4c201e2a935f110eaaf3ffecb8d"),
    // War Riders
    new AssetContractEntryAnchor(-146.5, 182.25, "0x5caebd3b32e210e85ce3e9d51638b9c445481567"),
    // Enjin
    new AssetContractEntryAnchor(-143, 183.5, "0xfaafdc07907ff5120a76b34b731b278c38d6043c"),
    // Infinity Crystal
    new AssetContractEntryAnchor(-143, 185.5, "0x543ecfb0d28fa40d639494957e7cba52460f490e"),
    // all. Use empty for no category
    new AssetContractEntryAnchor(-143, 189, ""),
    // cheese wizards
    new AssetContractEntryAnchor(-143, 192, "0x2f4bdafb22bd92aa7b7552d270376de8edccbc1e"),
    // neon district
    new AssetContractEntryAnchor(-143, 194, "0x1276dce965ada590e42d62b3953ddc1ddceb0392"),
]

// Request an OpenSea API key from https://docs.opensea.io/reference
const OPENSEA_API_KEY = "XXX"
// -----------------------------------------------------------------

let marketCategoryChosen = false;
let marketLockedForPlayer = null;

const p = new Parcel(parcel_id)

// when a player enters the parcel
p.on('playerenter', player => {
    console.log("player entered: " + player)

    // if the market is not locked currently
    if (is_market_locked() == false) {
        // lock it for the entering player
        lock_market(player)
    }
})

// When a player leaves the parcel
p.on('playerleave', player => {
    console.log("player left: " + player)

    // unlock the market if this is the player that locked it
    if (marketLockedForPlayer == player) {
        unlock_market()
    }
})

// Fetch the parcel
p.fetch()
    .then(() => {
        // start listening for events
        let port = p.listen()

        console.log(`Listening on port ${port}`)
    })

// Refresh a market with a parcel link and asset contract asset_contract_address to refresh under (use empty "" for all categories)
function refresh_market(parcel, asset_contract_address) {
    console.log("Refreshing gallery for " + asset_contract_address)

    const num_display_images = cheap_images.length + expensive_images.length;

    const opensea_base_url = 'https://api.opensea.io/api/v1/events/?event_type=created&only_opensea=true&limit=' + num_display_images;
    // fetch open sea assets. Build the URL.
    var url = (asset_contract_address.length > 0) ?
        opensea_base_url + "&asset_contract_address=" + asset_contract_address :
        opensea_base_url

    console.log(url)
    options = {
        headers: {
            "X-My-Header": "This is a custom header field"
        }
    }
    // TODO use API key in header
    fetch(url, {
            headers: {
                'X-API-KEY': OPENSEA_API_KEY
            }
        })
        // Turn response into json
        .then(res => res.json())
        .then(res => {
            // iterate through each asset event and either take the asset or // the first asset if it's in a asset_bundle
            var asset_list = []
            for (i = 0; i < res.asset_events.length; i++) {
                var event = res.asset_events[i]

                var permalink = null;
                var price_token_decimals = event.payment_token.decimals
                var price = event.starting_price / 10 ** price_token_decimals
                var price_usd = price * event.payment_token.usd_price

                if (event.asset === null) {
                    permalink = event.asset_bundle.assets[0].permalink
                } else {
                    permalink = event.asset.permalink
                }
                asset_list.push({
                    "permalink": permalink,
                    "price_usd": price_usd
                })
            }

            // sort the assets by price (USD) since sometimes people list items by ETH or DAI
            var sorted_assets = asset_list.sort((a, b) => a.price_usd - b.price_usd);

            // console.log(sorted_assets)

            // Assets are sorted by cheapest -> expensive
            // Set the cheap images first
            var asset_index = set_image_urls(p, sorted_assets, 0, cheap_images)
            // now set the expensive images
            asset_index = set_image_urls(p, sorted_assets, asset_index, expensive_images);
        })
}

function set_image_urls(parcel, assets, asset_index, image_ids) {
    for (i = 0; i < image_ids.length; i++) {
        let image = parcel.getFeatureById(image_ids[i])

        var permalink = assets[asset_index++].permalink

        image.set({
            url: permalink
        })
    }

    return asset_index
}

// Return whether the market is currently locked by a player
function is_market_locked() {
    return (marketLockedForPlayer != null);
}

// Lock the market for a specific player
function lock_market(locking_player) {
    marketLockedForPlayer = locking_player;

    // first time the player moves determines which entrance they used
    locking_player.on('move', (move) => {
        // if the market category hasn't been chosen yet
        if (marketCategoryChosen == false) {
            // determine the player's position
            player_x = move.position[0]
            player_z = move.position[2]

            console.log("player enter position: " + move.position)

            // and refresh the market for the appropriate asset contract
            var category_address = find_closest_asset_address(player_x, player_z)

            refresh_market(p, category_address)

            marketCategoryChosen = true;
        }
    })

    console.log("market locked for player: " + locking_player)
}

// Find the closest asset contract address for a given entering player position
function find_closest_asset_address(player_enter_x, player_enter_z) {
    var closest_distance = 9999999;

    var closet_coor = null;

    // for each coordinate our coordinate map
    for (var i = 0; i < coordinate_map.length; i++) {
        var coor = coordinate_map[i]

        // determine the distance from that coordinate to the player enter position
        var distance = find_distance(player_enter_x, player_enter_z, coor.x, coor.z)

        // if this coordinate is closer set it as our closest
        if (distance < closest_distance) {
            closest_distance = distance
            closet_coor = coor;
        }
    }

    // return the address of the closest coordinate
    if (closet_coor != null) {
        return closet_coor.address
    } else {
        return "";
    }
}

// return distance between 2 points
function find_distance(x1, y1, x2, y2) {
    return Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));
}

// unlock the market for use again
function unlock_market() {
    marketLockedForPlayer = null;
    marketCategoryChosen = false

    console.log("market unlocked")
}