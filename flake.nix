{
  description = "Primo development shell";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs =
    { nixpkgs, flake-utils, ... }:
    flake-utils.lib.eachDefaultSystem (
      system:
      let
        pkgs = nixpkgs.legacyPackages.${system};
      in
      {
        devShells.default = pkgs.mkShell {
          packages = [
            # CI pins Bun 1.4.2 (.github/workflows). Compare `bun --version` after `nix flake lock`.
            pkgs.bun
            # vitest and the lint plugin host run on Node, not Bun.
            pkgs.nodejs_24
            # The `bd` issue tracker that AGENTS.md works from.
            pkgs.beads
            # deploy.yml pipes the smoke test through jq.
            pkgs.jq
          ];
        };
      }
    );
}
