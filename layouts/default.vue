<script setup lang="ts">
useHead({
    htmlAttrs: {
        lang: 'ru',
    },
    meta: [
        { charset: 'utf-8' },
        { name: 'STANKIN Schedule Generator', content: 'Author: ebolblga' },
    ],
    link: [
        {
            rel: 'prefetch',
            href: '/Montserrat-Regular.ttf',
            as: 'font',
            type: 'font/woff2',
            crossorigin: 'anonymous',
        },
        {
            rel: 'icon',
            href: '/favicon.ico',
            crossorigin: 'anonymous',
        },
    ],
})
</script>
<template>
    <div class="h-screen bg-background text-text">
        <slot />
    </div>
</template>
<style>
body {
    margin: 0;
    font-size: 14px;
    font-family: Montserrat;
    background-color: #282828;
}

@font-face {
    font-family: 'Montserrat';
    src: url('/Montserrat-Regular.ttf') format('truetype');
    font-weight: normal;
    font-style: normal;
}

.scrollbar::-webkit-scrollbar {
    width: 8px;
    height: 8px;
}

.scrollbar::-webkit-scrollbar-track {
    box-shadow: transparent;
}

.scrollbar::-webkit-scrollbar-thumb {
    background-color: darkgrey;
    outline: 1px solid slategrey;
    border-radius: 4px;
}

.scrollbar::-webkit-scrollbar-corner {
    background: transparent;
}
</style>
