/* Native app entry point for the Python Connector bridge. */
#include <mach-o/dyld.h>
#include <limits.h>
#include <stdint.h>
#include <stdio.h>
#include <string.h>
#include <unistd.h>

int main(void) {
    char path[PATH_MAX];
    uint32_t size = sizeof(path);
    if (_NSGetExecutablePath(path, &size) != 0) return 1;
    /* executable -> MacOS -> Contents -> proxy.app -> addon directory */
    for (int i = 0; i < 4; i++) {
        char *slash = strrchr(path, '/');
        if (!slash) return 1;
        *slash = '\0';
    }
    if (strlen(path) + sizeof("/proxy.py") > sizeof(path)) return 1;
    strcat(path, "/proxy.py");
    execl("/usr/bin/python3", "python3", path, (char *)NULL);
    perror("Cannot start Zotero bridge");
    return 1;
}
