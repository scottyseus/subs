import entryState from "./states/entry-state";
import aboutState from "./states/about-state";
import instructionsState from "./states/instructions-state";
import instructionsState2 from "./states/instructions-state2";
import instructionsState2_5 from "./states/instructions-state2_5";
import instructionsState3 from "./states/instructions-state3";
import instructionsState4 from "./states/instructions-state4";
import gameOverState from "./states/game-over-state";
import assetLoadState from "./states/asset-load-state";
import fontLoadState from "./states/font-load-state";
import victoryState from "./states/victory-state";

var game = new Phaser.Game(640, 512, Phaser.AUTO, Phaser.AUTO, 'game', undefined, undefined, false);
game.state.add("Entry", entryState(game));
game.state.add("About", aboutState(game));
game.state.add("Instructions", instructionsState(game));
game.state.add("Instructions2", instructionsState2(game));
game.state.add("Instructions2.5", instructionsState2_5(game));
game.state.add("Instructions3", instructionsState3(game));
game.state.add("Instructions4", instructionsState4(game));
game.state.add("GameOver", gameOverState(game));
game.state.add("AssetLoad", assetLoadState(game));
game.state.add("FontLoad", fontLoadState(game));
game.state.add("Victory", victoryState(game));
game.state.start("FontLoad");