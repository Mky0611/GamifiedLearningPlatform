#!/usr/bin/env python3
"""Build verified Common English Vocabulary Pool (~1,400-2,000 everyday words)
strictly intersected with the verified en-wl/wordlist v2 english-words.txt lexicon
plus curated 2-letter high-frequency function/verb words.
Outputs common-words.txt, updates english-words.txt with the 24 curated 2-letter words,
and generates SHA-256 lexicon-manifest.json for both backend and frontend.
"""
from __future__ import annotations

import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[4]
BACKEND_DIR = ROOT / "src/main/resources/lexicon"
FRONTEND_DATA = ROOT / "src/main/resources/FrontEnd/assets/data"

COMMON_2_LETTER_WORDS = {
    "AM", "AN", "AS", "AT", "BE", "BY", "DO", "GO", "HE", "IF", "IN", "IS",
    "IT", "ME", "MY", "NO", "OF", "ON", "OR", "SO", "TO", "UP", "US", "WE"
}

CATEGORIES = {
    "daily_life": """
        able about above across act add after again age ago air all almost alone along already also always
        among amount and anger angle another answer any anyone anything anyway apart appear area arm around
        arrive art article ask away back bad bag ball band bank bar base basic bath bear beat beauty bed
        before begin behind believe bell belong below belt bench bend beside best better between beyond big
        bill bit black block blood blow blue board boat body bone book boot border born both bottle bottom
        box boy brain branch brave bread break breath bridge bright bring broad brother brown brush build
        burn burst bus busy but buy call calm came camp can candle cap car card care carry case cast cat
        catch cause cell center chain chair chance change charge cheap check cheer chest child choice choose
        church circle city claim class clean clear climb clock close cloth clothes cloud club coat coffee
        cold collect color come common company compare complete concern condition connect consider contain
        continue control cook cool copy corner cost could count country couple course cover craft crash cream
        create credit crew crop cross crowd crown cry cup cure curve cut cycle daily dance danger dark data
        date daughter day dead deal dear death decide deep defeat defend degree delay deliver demand deny
        depend describe desert design desire desk detail develop device die differ difficult dinner direct
        dirt dirty discover discuss dish distance divide doctor dog dollar door double doubt down draw dream
        dress drink drive drop dry duck due dull during dust duty each ear early earn earth east easy eat
        edge edit effect effort egg eight either elder elect element else empty end enemy energy engine
        enjoy enough enter entire equal escape even evening event ever every everyone everything everywhere
        exact exam example excite excuse exercise exist exit expand expect expense experience explain
        express extend extra eye face fact fail fair fall false fame family famous fan fancy far farm fast
        fat fate father fault favor fear feast feather feed feel fellow female fence few field fierce fight
        figure fill film final find fine finger finish fire firm first fish fit five fix flag flame flash
        flat flavor flesh flight float flock flood floor flour flow flower fluid fly focus fog fold follow
        food fool foot for force foreign forest forget forgive fork form formal former fort forth fortune
        forward found four frame free freeze fresh friend from front frost fruit fry fuel full fun function
        fund funny fur furniture future
    """,
    "family_people": """
        adult aunt baby boy brother child children cousin dad daughter elder family father fellow friend
        girl grand grandfather grandmother grandson group guest guide guy hero husband infant kid king
        lady leader lover man men mom mother neighbor nephew niece nurse parent partner people person
        prince princess queen relative sibling sister son spouse stranger student teacher teen teenager
        twin uncle user victim visitor wife woman women worker youth
    """,
    "food_drink": """
        apple bacon bake banana bean beef beer berry biscuit bitter boil bowl bread breakfast butter cabbage
        cake candy carrot cereal cheese cherry chicken chili chip chocolate coffee cookie cook corn cream
        crisp crumb crust cup curry cut dinner dish drink duck eat egg dinner feast feed fig fish flour
        food fork fresh fruit fry garlic ginger glass grain grape gravy grill ham honey ice jam juice
        kitchen knife kettle lamb lemon lunch meal meat melon milk mint mix mug noodle nut oat oil
        olive onion orange oven pan pancake pasta peach pear pea pepper pie pizza plate plum pork
        potato pot pour roast rice roll salad salt sandwich sauce sausage serve shake slice smell snack
        soup sour spice spoon steak stew stir sugar supper sweet taste tea toast tomato tray treat
        turkey turnip vegetable vinegar wait water wheat wine yam yeast yogurt
    """,
    "animals_nature": """
        ant ape ash bark bat bay beach bear beast bee beetle berry birch bird bloom blossom boat breeze
        brook bud bug bull bush butterfly cactus calf camel canary canyon cape cat cattle cave cedar
        chick chicken clam cliff cloud clover coal coast cobweb coral corn cougar cow crab crane creek
        cricket crow crown crystal cub current daisy dawn deer desert dew dirt doe dog dolphin donkey
        dove dragon duck dust eagle earth east eclipse eel egg elephant elk elm emerald falcon farm fawn
        feather fern field finch fire fir fish flame flood flora flower fog forest fork fox frog frost
        fruit gale garden garlic gas gazelle gem geyser glacier goat gold goose grain grass gravel
        grove gull hawk hay hazel heat hedge hen herb herd hill hive hog hollow honey hoof horn horse
        hound ice inlet insect island ivy jaguar jay jellyfish jungle kelp kid kitten koala lake lamb
        land lark lava lawn leaf ledge lemon leopard lichen life light lightning lily lime lion lizard
        llama lobster log lotus lynx magnet maple marsh meadow melon mist mole monkey moon moose moss
        moth mount mountain mouse mud mule mushroom mussel nature nest nettle night north oak oasis
        ocean olive onion orchid ore otter owl ox oyster palm panda panther parrot paw pea peach peak
        pear pearl pebble pelican penguin petal pet pig pigeon pike pine pit planet plant plum pond
        pony pool poplar poppy porcupine possum prairie puddle puffin puma pup puppy quail rabbit
        raccoon radish rain rainbow ram rat raven ray reef reed rhino ridge river road robin rock root
        rose salmon sand sap sardine sea seal seed shark sheep shell shore shrub silver sky sleet slope
        sloth slug snail snake snow soil south spark sparrow spider sprout spruce squid squirrel star
        steam stem stone stork storm stream sun sunflower sunrise sunset surf swallow swamp swan
        sweet tide tiger timber toad tortoise trail tree trout trunk tulip tuna turkey turtle twig
        valley vapor vine violet viper volcano vulture walnut wasp water waterfall wave weather weed
        whale wheat willow wind wing winter wolf wood woodpecker wool worm wren yak zebra
    """,
    "verbs": """
        accept achieve act adapt add admire admit adopt advance advise afford agree aim allow alter
        amaze amuse analyze announce annoy answer appear apply approach approve argue arise arrange
        arrest arrive ask assert assess assist assume assure attach attack attempt attend attract
        avoid awake award bake balance ban bang bare bark base bat bathe battle be bear beat become
        beg begin behave believe belong bend benefit bet bind bite blame blast bleed bless blind blink
        block bloom blow board boast boil bolt bomb bond book boom boost border borrow bother bounce
        bound bow box brake branch brave bread break breathe breed brew brick bridge brief bring
        broadcast broke broken brush bubble buck bud budget buffer build bulk bump bunch bundle burn
        burst bury bus bush button buy buzz cage calculate call calm camp can cancel candle cap
        capture card care carry carve case cash cast catch cause cease celebrate center chain chair
        chalk challenge champion chance change channel chant charge charm chart chase chat cheap check
        cheer chew chill chime chip choice choose chop circle cite claim clap clash clasp class clean
        clear click climb cling clip cloak clock clone close cloth cloud club clue cluster coach coal
        coast coat code coil coin collapse collect color combine come comfort command comment commit
        common compare compete complain complete compose compute conceal concede concentrate concern
        conclude conduct confer confess confirm conflict confuse connect conquer consent consider
        consist console construct consult consume contact contain contend content contest continue
        contract contrast control convert convey convince cook cool cooperate cope copy core corner
        correct cost couch cough could count counter couple course court cover crack cradle craft
        cram crane crash crawl craze creak cream create credit creep crest crew crib crime crisp
        criticize crop cross crouch crow crowd crown cruise crumble crunch crush cry cue cuff
        cultivate cup curb cure curl current curse curve cushion custom cut cycle dab dad daily
        damage damp dance dare dark dart dash data date dawn deal dear debate decay decide deck
        declare decline decorate decrease dedicate deed deem deep defeat defend define delay delete
        delight deliver demand demonstrate deny depart depend depict deploy deposit depress derive
        descend describe desert deserve design desire desk destroy detach detail detect determine
        develop devise devote dial dice die differ dig digest dim dine dip direct dirt disagree
        disappear disappoint disaster disc discard discharge disclose discount discover discuss
        disgrace disguise disgust dish dislike dismiss display dispute dissolve distance distinguish
        distribute disturb dive diverse divide divorce dizzy do dock doctor dodge dog doll donate
        done doom door dose dot double doubt dough dove down dozen draft drag drain drama drape draw
        dread dream dress drift drill drink drip drive drop drown drug drum dry duck due dull dump
        dunk dust duty dwell dye eager eagle ear early earn earth ease east eat echo edge edit
        educate effect effort egg eight either elbow elder elect element elevate eliminate else
        embark embrace emerge emit emotion emphasis employ empty enable enact enclose encounter
        encourage end endorse endure enemy energy enforce engage engine enhance enjoy enlarge
        enlist enough ensure enter entertain entire entitle entrance entry equal equip erase erect
        err error escape escort essay establish estimate evaluate even event ever every evidence
        evil evoke evolve exact exam examine example exceed excel except exchange excite exclude
        excuse execute exercise exert exhaust exhibit exist exit expand expect expel expense
        experience experiment expert explain explode explore export expose express extend extent
        extra extract eye face fact factor fade fail faint fair faith fake fall false fame familiar
        family famous fan fancy far fare farm fashion fast fasten fat fatal fate father fault favor
        fear feast feather feature fed feed feel fellow female fence ferry fetch fever few fiber
        fiction field fierce fight figure file fill film filter final finance find fine finger finish
        fire firm first fish fist fit five fix flag flame flank flap flare flash flat flavor flaw
        flee fleet flesh flex flick flight fling flip float flock flood floor flour flow flower fluid
        flush flute fly foam focus fog fold folk follow fond food fool foot for forbid force
        forecast foreign forest forever forget forgive fork form formal format former fort forth
        fortune forward foster found four fox fraction fragile frame frank fraud free freeze french
        fresh friction friend fright frog from front frost frown fruit fry fuel fulfill full fume
        fun function fund funny fur furnish furniture further fury fuse future gain gale gall gallop
        gamble game gang gap garage garden garlic gas gasp gate gather gauge gaze gear gem general
        generate generous gentle genuine gesture get ghost giant gift giggle gilt ginger girl give
        glad glance glare glass gleam glide glimpse glitter globe gloom glory gloss glove glow glue
        gnaw go goal goat god gold golf good goose gorge gossip govern grab grace grade gradual
        grain grand grant grape graph grasp grass grate grave gravel gravity graze grease great
        greed green greet grief grill grim grin grind grip groan groom groove grope ground group
        grow growl growth grub grudge grunt guard guess guest guide guild guilt guitar gulf gulp
        gum gun gush gust gut guy gym habit hail hair half hall halt hammer hand handle hang happen
        happy harbor hard hardly harm harmony harness harp harsh harvest haste hat hatch hate haul
        have hawk hay hazard haze head heal health heap hear heart heat heave heavy hedge heed
        heel height heir held hell hello helmet help hem hence herb herd here hero hesitate hide high
        hike hill him hint hip hire his history hit hitch hive hoard hoarse hobby hockey hold hole
        holiday hollow holy home honest honey honor hood hoof hook hoop hop hope horn horror horse
        hose host hot hotel hound hour house hover how howl hub hug huge hull hum human humble humor
        hump hunch hundred hung hunger hunt hurdle hurl hurry hurt husband hush hut hybrid hymn ice
        icon idea ideal identify idle idol ignore ill image imagine imitate immediate immense immune
        impact impair impart impatient impel implement imply import impose impress improve impulse
        in inch incident incline include income increase indeed index indicate indoor induce indulge
        industry infant infect infer infinite inflame inflate inflict influence inform infuse inhale
        inherit initial inject injure ink inland inner innocent input inquire insect insert inside
        insist inspect inspire install instance instant instead instinct instruct instrument insult
        insure intact intake intend intense intent interact interest interfere interior internal
        interpret interrupt interval intervene intimate into introduce invade invalid invent invest
        invite involve inward iron island isolate issue it item ivory jacket jail jam jar jaw jazz
        jealous jeans jelly jerk jest jet jewel job join joint joke jolly jolt journal journey joy
        judge juice jump junction june jungle junior junk jury just justify
    """,
    "adjectives_travel_school_work": """
        active actual sharp bright brief broad brown busy calm careful central certain cheap cheerful
        clean clear clever close cold common cool correct cozy crisp cruel curious cute damp dark
        dead dear deep dense direct dirty distant double dry dull dusty eager early easy empty
        entire equal exact excited fair false familiar famous fancy far fast fat favorite tidy
        fierce final fine firm first flat fond foreign formal former fortunate frank free frequent
        fresh friendly front full fun funny future gentle genuine giant glad global gloomy glorious
        good grand grateful great greedy green grim gross guilty happy hard harmless harsh hasty
        healthy heavy helpful high hollow honest hopeful horrible hot huge human humble hungry
        icy ideal idle ill immense immune important impossible inner innocent instant intact intense
        internal invalid crisp kind known large last late lazy lead lean least left legal level
        light likely limited linear little live lively local lone long loose loud lovely low loyal
        lucky mad magic main major male manual many massive mature mean medical medium mental merry
        mild minor modern modest moist moral mortal most muddy multiple mutual mysterious narrow
        native natural near neat necessary negative nervous new next nice noble noisy normal north
        notable novel nuclear numb numerous odd old only open opposite optional oral ordinary organic
        original other outer outside oval overall own pale parallel partial particular passive past
        patient peaceful peculiar perfect permanent personal physical plain plastic pleasant plenty
        polite poor popular positive possible potential powerful practical precious precise present
        pretty previous primary prime principal prior private probable proper proud public pure
        purple quick quiet quite radial random rapid rare raw ready real recent red regular
        related relative relaxed relevant reliable religious remaining remote repair repeat rich
        right rigid ripe risky roast robust romantic rough round royal rude rural sad safe salt
        same sandy sane scarce scared scenic school scientific score screen sea search season seat
        second secret secure select self senior sensitive separate serious severe shadow shallow
        shape sharp sheer shift shine shiny short should shout show shut shy sick side sight sign
        silent silk silly silver similar simple single site sixth size skill skinny slate sleek
        sleep slender slight slim slippery slow small smart smooth snap snow soaked sober social
        soft solar sole solid solo soluble some sore sorry sort sound sour source south space spare
        special specific speech speed spell spend sphere spice spicy spin spirit splendid split
        spoken sponge sponsor sport spot spray spread spring sprint spy square squeeze stable stack
        stadium staff stage stain stair stake stale stall stamp stand standard staple star stare
        stark start state static station statue status stay steady steak steal steam steel steep
        steer stem step stern stick sticky stiff still sting stink stir stitch stock stomach stone
        stool stoop stop store storm story stout stove straight strain strand strange strap straw
        stray streak stream street strength stress stretch strict stride strike string strip stripe
        strive stroke stroll strong struck structure struggle stub stuck student study stuff stumble
        stump stun stunt stupid sturdy style subject submit subtle succeed success such sudden
        suffer sufficient sugar suggest suit suitable suite sum summer summit summon sun super
        superior supervise supper supply support suppose supreme sure surface surge surplus surprise
        surrender surround survey survive suspect suspend sustain swallow swamp swan swarm sway swear
        sweat sweep sweet swell swift swim swing switch sword symbol symptom sync system
        table tablet tackle tag tail tailor take tale talent talk tall tame tan tangle tank tap tape
        target task taste taught tax taxi tea teach teacher team tear tease tech tedious teen teeth
        tell temper temple temporary tempt ten tenant tend tender tennis tense tent term terminal
        terrace terrain terrible test text texture thank that thaw theater theme then theory therapy
        there thermal these thick thief thin thing think third thirst thirteen thirty this thorn
        thorough those though thought thousand thread threat three threshold threw thrift thrill
        thrive throat throne through throw thrust thumb thump thunder thus tick ticket tide tidy
        tie tiger tight tile till tilt timber time timid tin tiny tip tiptoe tire tired tissue
        title to toad toast tobacco today toddler toe together toil toilet token told tolerate toll
        tomato tomb tomorrow ton tone tongue tonight too took tool tooth top topic torch tore
        torment tornado torrent tortoise toss total touch tough tour tourist toward towel tower
        town toy trace track tract trade tradition traffic tragedy trail train trait tram tramp
        transfer transform transit translate transmit transport trap trash travel tray tread
        treasure treat treaty tree trek tremble trend trial tribe trick tried trifle trigger trim
        trip triple triumph troop trophy tropical trouble trough troop true truly trump trunk trust
        truth try tub tube tuck tuft tug tulip tumble tune tunnel turban turf turkey turmoil turn
        turtle tutor twelfth twelve twenty twice twig twin twine twinkle twirl twist two type
        typical ugly ultimate umbrella unable uncle under undergo underlie underline understand
        undertake undo uneasy uneven unfair unfold unhappy uniform union unique unit unite universe
        unknown unless unlike unlikely unload unlock unlucky unpack unpleasant until unusual up
        update upgrade uphold upon upper upright upset upside upstairs upward urban urge urgent
        us usage use useful useless user usual utility utilize utter vacant vacation vacuum vague
        vain valid valley valuable value valve van vanish vanity vapor variety various vary vase
        vast vault vegetable vehicle veil vein velvet vendor venture verb verdict verify versatile
        verse version versus vertical very vessel vest veteran via viable vibrant vice victim
        victory video view vigor village villain vine vinegar violate violent violet violin virtual
        virtue virus visible vision visit visitor visual vital vivid vocal voice void volcano
        volume voluntary volunteer vote voucher vow vowel voyage vulgar vulnerable
    """,
    "basic_tech": """
        app array async audio auth backup band bandwidth battery binary bit block blog bluetooth board
        boot browser buffer bug build byte cable cache camera card case cell chart chat chip circuit
        click client clock cloud cluster code coding color column command compile compute computer
        config connect console contact control copy core crash create cursor cycle dash data database
        debug default delete demo design desktop dev device dial digital disc disk display doc dock
        domain door download draft drag drive driver drop dual echo edit email embed emoji empty
        encode engine enter entry enum equal error event exit expand export extend extra fail fake
        feature feed feedback fetch fiber field file fill filter find finish fire firewall firm fix
        flag flash flex float flow focus folder font force format frame free fresh front full func
        function fuse future gain game gaming gateway gear generate get gif gigabit git global glow
        goal gold grab grade graph grid ground group grow guard guess guide guild hack hacker handle
        hardware hash head header help hero hide high hint history hit hold home host hotkey html
        http hub icon idea idle image impact import inbox index info init input insert inside install
        int interface internet item java job join jpeg json jump key keyboard keyword kit label lan
        laptop laser launch layer layout lead leaf learn learned ledger left legacy level library life
        light limit line link linux list live load local lock log logic login logo loop lore loss lost
        mac macro magic mail main make manage map mark mask master match matrix max media memory
        menu merge mesh message meta method metric micro mild mime mind mini minimal mirror miss
        mobile mock mode model modem module monitor mono mood mount mouse move mp3 mute name nav
        navigate near need nest net network new next node noise none norm normal note notify null
        number numeric object off offer offline ok open option order origin os out output over
        overlay override pack package packet page pair panel parallel param parse part pass paste
        patch path pause peak peer pending percent perform phase phone photo php pixel place plain
        plan plane plant platform play player plot plug plugin plus png point pointer poll pool pop
        port portal post power prefix press preview price primary prime print privacy private probe
        process profile program project prompt proof props protocol proxy public pull pulse pure
        push puzzle python query quest queue quick quiet quit quiz quota quote radio raid rail ram
        random range rank rate raw reach read ready real realm reboot recall receive record recover
        red redirect reduce ref refill refresh region register relay release reload remote remove
        rename render repair repeat replace replay report request require reset resize resolve
        resource response rest restart restore result resume retail retain retry return reveal
        reverse review reward ribbon rich right ring risk river road robot robust rock role roll
        room root rotate round route router row royal rule run runtime rush safe salt sample sand
        save scale scan scene schedule schema scheme scope score screen script scroll seal search
        second secret section secure security seed seek segment select self send sense sensor sent
        sequence serial series server service session set setting settle setup shade shadow shake
        shape share sharp sheet shell shield shift shine ship shop short shortcut shot show side
        sign signal silent silicon silver simple simulate since single site size sketch skill skip
        slate sleep slice slide slim slope slow small smart smoke smooth snap snippet snow socket
        soft software soil solid solo solve some song sort soul sound source south space span spark
        speak spec special speed spell spend spin spirit split spot spray spread spring sprint
        sprite sql squad square src ssh stack staff stage stand standard star start state static
        stats status stay steady steam steel step stick still stock stone stop storage store storm
        story straight stream street strength stress strict strike string strip strong struct
        structure student studio study stuff style sub submit subtle success suffix sum summary
        sun super supply support suppose sure surface surge swap switch symbol sync syntax system
        tab table tablet tag tail take talk tall tap target task team tech telecom tell temp
        template term terminal test text theme then theory thick thin thing think third thread
        threat three threshold throw thunder tick ticket tide tie tight tile tilt time timer tiny
        tip title token tone tool toolbar tooltip top topic torch total touch tour toward towel
        tower town trace track trade traffic trail train trait trans transfer transform transit
        translate transmit trap trash travel tray tree trend trial trick trigger trim triple troll
        troop trophy trouble true trust truth try tube tune tunnel turbo turn tutorial tweak tweet
        twin twist two type typical ui ultra unable under undo unify union unique unit unknown
        unlock unpack unread unsafe unset until unused up update upgrade upload upper upset
        uptime upvoted url us usage use useful user usual utf utility utilize ux valid validate
        value variable vector vendor verify version vertical video view viewer virtual virus
        visible visit visitor visual vital voice void volume vote wait wake walk wall wan wand
        war ward warm warn warning wash waste watch water wave way weak wealth weapon wear web
        webcam webpage website week weight welcome well west what wheel when where which while
        white whole wide widget wifi wild win wind window wing winter wire wireless wise wish
        with wolf wood word work workflow world worm worth would wrap write writer wrong xml yaml
        year yellow yes yield you young zero zip zone zoom
    """,
}


def sha256_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def main() -> None:
    full_path = BACKEND_DIR / "english-words.txt"
    if not full_path.exists():
        raise FileNotFoundError(f"Missing verified lexicon: {full_path}")

    raw_full = {
        line.strip().upper()
        for line in full_path.read_text(encoding="utf-8").splitlines()
        if line.strip()
    }
    # Merge curated 2-letter everyday words strictly into verified full lexicon
    full_words = raw_full | COMMON_2_LETTER_WORDS

    candidate_common: set[str] = set(COMMON_2_LETTER_WORDS)
    per_category_counts: dict[str, int] = {}
    for cat, blob in CATEGORIES.items():
        tokens = [t.strip().upper() for t in blob.split() if t.strip().isalpha()]
        kept = {t for t in tokens if (2 <= len(t) <= 8) and (t in full_words)}
        per_category_counts[cat] = len(kept)
        candidate_common |= kept

    sorted_full = sorted(full_words)
    sorted_common = sorted(candidate_common)

    full_payload = "\n".join(sorted_full) + "\n"
    common_payload = "\n".join(sorted_common) + "\n"

    full_sha = sha256_bytes(full_payload.encode("utf-8"))
    common_sha = sha256_bytes(common_payload.encode("utf-8"))

    manifest = {
        "source": "en-wl/wordlist v2 (english-words.txt verified offline base) + curated everyday common vocabulary intersection + 24 high-frequency 2-letter words",
        "license": "LICENSE_EN_WL.txt",
        "fullCount": len(sorted_full),
        "fullSha256": full_sha,
        "commonCount": len(sorted_common),
        "commonSha256": common_sha,
        "categoryIntersections": per_category_counts,
        "twoLetterWhitelist": sorted(COMMON_2_LETTER_WORDS),
    }
    manifest_json = json.dumps(manifest, indent=2) + "\n"

    (BACKEND_DIR / "english-words.txt").write_text(full_payload, encoding="utf-8")
    (FRONTEND_DATA / "english-words.txt").write_text(full_payload, encoding="utf-8")
    (BACKEND_DIR / "common-words.txt").write_text(common_payload, encoding="utf-8")
    (FRONTEND_DATA / "common-words.txt").write_text(common_payload, encoding="utf-8")
    (BACKEND_DIR / "lexicon-manifest.json").write_text(manifest_json, encoding="utf-8")
    (FRONTEND_DATA / "lexicon-manifest.json").write_text(manifest_json, encoding="utf-8")

    print(f"Built full={len(sorted_full)} sha={full_sha[:12]} | common={len(sorted_common)} sha={common_sha[:12]}")
    print("Category intersections:", per_category_counts)


if __name__ == "__main__":
    main()
