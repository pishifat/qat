<template>
    <section>
        <h5>Wiki Markdown Generator</h5>
        <p class="text-secondary small">
            Generate BN listing for the wiki page.
        </p>

        <div>
            <button
                class="btn btn-primary btn-sm"
                @click="generateMarkdown"
            >
                Generate BN listing
            </button>
            <button
                v-if="markdownOutput"
                class="btn btn-success btn-sm ml-2"
                @click="copyToClipboard"
            >
                Copy to Clipboard
            </button>
        </div>

        <div v-if="markdownOutput" class="card mt-3">
            <textarea
                v-model="markdownOutput"
                class="form-control"
                rows="20"
                readonly
                style="font-family: monospace; font-size: 12px;"
            />
        </div>
    </section>
</template>

<script>
import { mapState } from 'vuex';

export default {
    name: 'WikiMarkdownGenerator',
    data () {
        return {
            markdownOutput: '',
        };
    },
    computed: {
        ...mapState('users', [
            'users',
        ]),
    },
    methods: {
        generateMarkdown () {
            // Filter users to only include BN
            const bnUsers = this.users.filter(user =>
                user.groups && user.groups.includes('bn') &&
                user.modesInfo && user.modesInfo.length > 0
            );

            if (bnUsers.length === 0) {
                this.markdownOutput = 'No BNs found.';

                return;
            }

            // Group users by mode and level
            const grouped = {
                full: {
                    osu: [],
                    taiko: [],
                    catch: [],
                    mania: [],
                },
                probation: {
                    osu: [],
                    taiko: [],
                    catch: [],
                    mania: [],
                },
            };

            bnUsers.forEach(user => {
                user.modesInfo.forEach(modeInfo => {
                    if (modeInfo.mode === 'none') return;

                    const level = modeInfo.level === 'full' ? 'full' : 'probation';

                    if (grouped[level][modeInfo.mode]) {
                        grouped[level][modeInfo.mode].push(user);
                    }
                });
            });

            // Sort users alphabetically by username
            Object.keys(grouped).forEach(level => {
                Object.keys(grouped[level]).forEach(mode => {
                    grouped[level][mode].sort((a, b) =>
                        a.username.localeCompare(b.username, 'en', { sensitivity: 'base' })
                    );
                });
            });

            // Generate markdown
            let markdown = '';

            const modes = ['osu', 'taiko', 'catch', 'mania'];
            const modeNames = {
                osu: 'osu!',
                taiko: 'osu!taiko',
                catch: 'osu!catch',
                mania: 'osu!mania',
            };

            // Full BN section
            markdown += this.generateSectionMarkdown(
                'Full Beatmap Nominators',
                grouped.full,
                modes,
                modeNames
            );

            // Probation BN section
            markdown += this.generateSectionMarkdown(
                'Probationary Beatmap Nominators',
                grouped.probation,
                modes,
                modeNames
            );

            this.markdownOutput = markdown.trim();
        },

        generateSectionMarkdown (sectionTitle, groupedByMode, modes, modeNames) {
            let markdown = `### ${sectionTitle}\n\n`;

            modes.forEach(mode => {
                markdown += `#### ${modeNames[mode]}\n\n`;

                if (groupedByMode[mode].length === 0) {
                    markdown += 'No members at this time.\n\n';
                } else {
                    markdown += '| Name | Additional languages |\n';
                    markdown += '| :-- | :-- |\n';

                    groupedByMode[mode].forEach(user => {
                        const flagMarkdown = user.countryCode ? `::{ flag=${user.countryCode.toUpperCase()} }:: ` : '';
                        const usernameLink = `[${this.escapeMarkdown(user.username)}](https://osu.ppy.sh/users/${user.osuId})`;
                        const languages = this.formatLanguages(user.languages);

                        markdown += `| ${flagMarkdown}${usernameLink} | ${languages} |\n`;
                    });

                    markdown += '\n';
                }
            });

            return markdown;
        },

        formatLanguages (languages) {
            if (!languages || languages.length === 0) {
                return '';
            }

            // Capitalize first letter of each language
            const formatted = languages.map(lang => {
                if (!lang) return '';

                return lang.charAt(0).toUpperCase() + lang.slice(1);
            });

            return formatted.join(', ');
        },

        escapeMarkdown (text) {
            // Escape special markdown characters in usernames
            return text.replace(/[\[\]()_]/g, '\\$&');
        },

        async copyToClipboard () {
            try {
                await navigator.clipboard.writeText(this.markdownOutput);
                this.$store.dispatch('updateToastMessages', {
                    type: 'success',
                    message: 'Copied to clipboard!',
                });
            } catch (err) {
                this.$store.dispatch('updateToastMessages', {
                    type: 'error',
                    message: 'Failed to copy to clipboard',
                });
            }
        },
    },
};
</script>
