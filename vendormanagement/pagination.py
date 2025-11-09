from rest_framework.pagination import PageNumberPagination


class CustomPageNumberPagination(PageNumberPagination):
    """
    Custom pagination class that supports dynamic page_size via query parameter
    """
    page_size = 5
    page_size_query_param = 'page_size'
    max_page_size = 100

